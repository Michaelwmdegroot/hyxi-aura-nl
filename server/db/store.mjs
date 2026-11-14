import { randomUUID } from 'node:crypto';
import { keyedHash, openLead, parseEncryptionKey, parseHashKey, sealLead } from './crypto.mjs';

const PRIVACY_VERSION = '2026-11-14';
const KEY_ID = 'v1';
const utc = millis => new Date(millis).toISOString().slice(0, 23).replace('T', ' ');

export class LeadConflictError extends Error {
  constructor() {
    super('Conflicting request key.');
    this.code = 'REQUEST_CHANGED';
  }
}

export function createMysqlLeadStore({ pool, encryptionKey, hashSecret, now = Date.now }) {
  if (!pool || typeof pool.getConnection !== 'function') throw new Error('A MySQL connection pool is required.');
  const encKey = parseEncryptionKey(encryptionKey);
  const macKey = parseHashKey(hashSecret);
  const hmac = text => keyedHash(macKey, text);

  async function lookupSubmission(keyHash, bodyHash) {
    const [rows] = await pool.execute(
      'SELECT s.payload_hash, l.request_id FROM aura_submission_keys s JOIN aura_leads l ON l.id = s.lead_id WHERE s.key_hash = ? LIMIT 1',
      [keyHash],
    );
    if (rows.length === 0) return null;
    if (rows[0].payload_hash !== bodyHash) throw new LeadConflictError();
    return { requestId: rows[0].request_id, duplicate: true };
  }

  async function receive({ lead, requestKey }) {
    const keyHash = hmac(requestKey);
    const bodyHash = hmac(JSON.stringify(lead));
    const existing = await lookupSubmission(keyHash, bodyHash);
    if (existing) return existing;
    const leadId = randomUUID();
    const notificationId = randomUUID();
    const requestId = 'AURA-' + randomUUID();
    const timestamp = utc(now());
    const encrypted = sealLead(lead, leadId, encKey, KEY_ID);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [locked] = await conn.execute(
        'SELECT s.payload_hash, l.request_id FROM aura_submission_keys s JOIN aura_leads l ON l.id = s.lead_id WHERE s.key_hash = ? FOR UPDATE',
        [keyHash],
      );
      if (locked.length > 0) {
        if (locked[0].payload_hash !== bodyHash) throw new LeadConflictError();
        await conn.rollback();
        return { requestId: locked[0].request_id, duplicate: true };
      }

      await conn.execute(
        'INSERT INTO aura_leads (id, request_id, request_type, status, source_domain, encrypted_payload, encryption_key_id, privacy_version, contact_requested_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [leadId, requestId, 'advice', 'new', 'hyxi-aura.nl', encrypted, KEY_ID, PRIVACY_VERSION, timestamp, timestamp, timestamp],
      );
      await conn.execute(
        'INSERT INTO aura_submission_keys (key_hash, payload_hash, lead_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
        [keyHash, bodyHash, leadId, timestamp, utc(now() + 24 * 60 * 60 * 1000)],
      );
      await conn.execute(
        'INSERT INTO aura_lead_events (lead_id, event_type, actor_type, occurred_at) VALUES (?, ?, ?, ?)',
        [leadId, 'lead_received', 'visitor', timestamp],
      );
      await conn.execute(
        'INSERT INTO aura_notification_outbox (id, lead_id, event_type, delivery_status, next_attempt_at, mail_message_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [notificationId, leadId, 'lead_received', 'pending', timestamp, '<' + requestId + '@hyxi-aura.nl>', timestamp, timestamp],
      );
      await conn.commit();
      return { requestId, duplicate: false };
    } catch (error) {
      await conn.rollback().catch(() => {});
      // Two concurrent submissions using one key may race. Resolve the unique
      // key conflict by checking the winning transaction rather than creating
      // a second lead or exposing an SQL error to the public API.
      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        const winner = await lookupSubmission(keyHash, bodyHash);
        if (winner) return winner;
      }
      throw error;
    } finally {
      conn.release();
    }
  }

  async function claimNextNotification() {
    const [candidates] = await pool.execute(
      "SELECT id FROM aura_notification_outbox WHERE delivery_status IN ('pending','retry_wait') AND next_attempt_at <= UTC_TIMESTAMP(3) ORDER BY next_attempt_at ASC LIMIT 8",
    );
    for (const item of candidates) {
      const [update] = await pool.execute(
        "UPDATE aura_notification_outbox SET delivery_status = 'sending', attempt_count = attempt_count + 1, claimed_until = DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 90 SECOND) WHERE id = ? AND delivery_status IN ('pending','retry_wait') AND next_attempt_at <= UTC_TIMESTAMP(3)",
        [item.id],
      );
      if (update.affectedRows !== 1) continue;
      const [rows] = await pool.execute(
        'SELECT o.id, o.attempt_count, o.mail_message_id, l.id AS lead_id, l.request_id, l.encrypted_payload, l.encryption_key_id, l.contact_requested_at FROM aura_notification_outbox o JOIN aura_leads l ON l.id = o.lead_id WHERE o.id = ? LIMIT 1',
        [item.id],
      );
      if (rows.length !== 1) throw new Error('Claimed notification is missing its lead.');
      return rows[0];
    }
    return null;
  }

  async function recoverStaleClaims() {
    // A crash during SMTP DATA could have sent a message; never blindly retry.
    const [result] = await pool.query(
      "UPDATE aura_notification_outbox SET delivery_status = 'uncertain', claimed_until = NULL, last_error_code = 'WORKER_INTERRUPTED' WHERE delivery_status = 'sending' AND claimed_until < UTC_TIMESTAMP(3)",
    );
    return result.affectedRows;
  }

  async function completeNotification(id, state, errorCode = null, delaySeconds = 0) {
    if (!['accepted','retry_wait','failed','uncertain'].includes(state)) throw new Error('Unknown notification status.');
    const error = typeof errorCode === 'string' && /^[A-Z0-9_]{1,64}$/.test(errorCode) ? errorCode : null;
    const wait = Math.max(0, Math.min(3600, Math.trunc(delaySeconds)));
    const [result] = await pool.execute(
      "UPDATE aura_notification_outbox SET delivery_status = ?, last_error_code = ?, claimed_until = NULL, accepted_by_smtp_at = CASE WHEN ? = 'accepted' THEN UTC_TIMESTAMP(3) ELSE accepted_by_smtp_at END, next_attempt_at = DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? SECOND) WHERE id = ? AND delivery_status = 'sending'",
      [state, error, state, wait, id],
    );
    if (result.affectedRows !== 1) throw new Error('Outbox lease no longer valid.');
  }

  function decodeNotification(row) {
    return openLead(row.encrypted_payload, row.lead_id, encKey, row.encryption_key_id);
  }

  return { receive, claimNextNotification, recoverStaleClaims, completeNotification, decodeNotification };
}
