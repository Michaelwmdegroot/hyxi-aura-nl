import { randomInt, randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { keyedHash, openLead, parseEncryptionKey, parseHashKey, sealLead } from './crypto.mjs';
import { assertMigrationChecksum, assertNotificationBudgetStructure } from './schema-check.mjs';

const PRIVACY_VERSION = '2026-11-14';
const KEY_ID = 'v1';
const utc = millis => new Date(millis).toISOString().slice(0, 23).replace('T', ' ');

export class LeadConflictError extends Error {
  constructor() {
    super('Conflicting request key.');
    this.code = 'REQUEST_CHANGED';
  }
}

export async function assertNotificationBudgetSchema(pool) {
  await assertNotificationBudgetStructure(pool);
  await assertMigrationChecksum(pool,'004_notification_budget');
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

  async function receiveAttempt({ lead, requestKey }) {
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
      // Avoid a locking read on a non-existent unique key: it creates InnoDB
      // gap locks which deadlock under concurrent identical submissions.
      // Let the key's UNIQUE constraint choose the single winner instead.
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
        // Use the already-acquired connection, not pool.execute(): several
        // simultaneous losing transactions can otherwise exhaust the small
        // pool while all are waiting for another checkout (self-deadlock).
        const [winners] = await conn.execute(
          'SELECT s.payload_hash, l.request_id FROM aura_submission_keys s JOIN aura_leads l ON l.id = s.lead_id WHERE s.key_hash = ? LIMIT 1',
          [keyHash],
        );
        if (winners.length) {
          if (winners[0].payload_hash !== bodyHash) throw new LeadConflictError();
          return { requestId: winners[0].request_id, duplicate: true };
        }
      }
      throw error;
    } finally {
      conn.release();
    }
  }

  async function receive(payload) {
    // InnoDB can still deadlock when two writers race to insert the same
    // unique submission key. A deadlock victim has been rolled back. Retry a
    // bounded number of times; the eventual winning row is returned, not
    // inserted twice. Only transient lock errors are retried.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await receiveAttempt(payload);
      } catch (error) {
        if (!['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error?.code) &&
            ![1213, 1205].includes(error?.errno)) throw error;
        if (attempt === 4) throw error;
        await sleep(20 * (attempt + 1) + randomInt(0, 40));
      }
    }
    throw new Error('MySQL retry limit exhausted.');
  }

  async function claimNextNotification({ dailyLimit = 100 } = {}) {
    if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 1000) {
      throw new Error('A valid daily SMTP attempt budget is required.');
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Read the DB's UTC date once: a midnight boundary must not split the
      // reservation across two dates. The day row serializes ALL workers.
      const [dates] = await conn.query("SELECT DATE_FORMAT(UTC_TIMESTAMP(3),'%Y-%m-%d') AS day_key");
      const day = dates[0].day_key;
      await conn.execute(
        'INSERT INTO aura_notification_daily_budget (day_key,attempt_count) VALUES (?,0) ON DUPLICATE KEY UPDATE attempt_count=attempt_count',
        [day],
      );
      const [budgets] = await conn.execute(
        'SELECT attempt_count FROM aura_notification_daily_budget WHERE day_key=? FOR UPDATE', [day],
      );
      if (Number(budgets[0].attempt_count) >= dailyLimit) {
        await conn.commit();
        return null; // Keep pending/retry_wait and attempts unchanged until tomorrow.
      }
      const [candidates] = await conn.query(
        "SELECT id FROM aura_notification_outbox WHERE delivery_status IN ('pending','retry_wait') AND next_attempt_at <= UTC_TIMESTAMP(3) ORDER BY next_attempt_at ASC,id ASC LIMIT 1 FOR UPDATE",
      );
      if (!candidates.length) {
        await conn.commit();
        return null; // An empty queue consumes no SMTP budget.
      }
      const id = candidates[0].id;
      await conn.execute(
        "UPDATE aura_notification_outbox SET delivery_status='sending',attempt_count=attempt_count+1,claimed_until=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 90 SECOND) WHERE id=?",
        [id],
      );
      const [rows] = await conn.execute(
        'SELECT o.id,o.attempt_count,o.mail_message_id,l.id AS lead_id,l.request_id,l.encrypted_payload,l.encryption_key_id,l.contact_requested_at FROM aura_notification_outbox o JOIN aura_leads l ON l.id=o.lead_id WHERE o.id=? LIMIT 1',
        [id],
      );
      if (rows.length !== 1) throw new Error('Claimed notification is missing its lead.');
      await conn.execute(
        'UPDATE aura_notification_daily_budget SET attempt_count=attempt_count+1 WHERE day_key=?', [day],
      );
      // Reserve before SMTP starts. A crash or failed send conservatively
      // consumes this slot; restarting cannot reset the daily allowance.
      await conn.commit();
      return rows[0];
    } catch (error) {
      await conn.rollback().catch(() => {});
      throw error;
    } finally { conn.release(); }
  }

  async function recoverStaleClaims() {
    // A crash during SMTP DATA could have sent a message; never blindly retry.
    const [result] = await pool.query(
      "UPDATE aura_notification_outbox SET delivery_status = 'uncertain', claimed_until = NULL, last_error_code = 'WORKER_INTERRUPTED' WHERE delivery_status = 'sending' AND claimed_until < UTC_TIMESTAMP(3)",
    );
    return result.affectedRows;
  }

  async function completeNotification(id, state, errorCode = null, delaySeconds = 0, { expectedAttempt } = {}) {
    if (!['accepted','retry_wait','failed','uncertain'].includes(state)) throw new Error('Unknown notification status.');
    if (!Number.isInteger(expectedAttempt) || expectedAttempt < 1) throw new Error('Claimed attempt is required.');
    const error = typeof errorCode === 'string' && /^[A-Z0-9_]{1,64}$/.test(errorCode) ? errorCode : null;
    const wait = Math.max(0, Math.min(3600, Math.trunc(delaySeconds)));
    const [result] = await pool.execute(
      "UPDATE aura_notification_outbox SET delivery_status = ?, last_error_code = ?, claimed_until = NULL, accepted_by_smtp_at = CASE WHEN ? = 'accepted' THEN UTC_TIMESTAMP(3) ELSE accepted_by_smtp_at END, next_attempt_at = DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? SECOND) WHERE id = ? AND delivery_status = 'sending' AND attempt_count = ?",
      [state, error, state, wait, id, expectedAttempt],
    );
    if (result.affectedRows !== 1) throw Object.assign(new Error('Outbox lease no longer valid.'), {code:'STALE_NOTIFICATION_CLAIM'});
  }

  function decodeNotification(row) {
    return openLead(row.encrypted_payload, row.lead_id, encKey, row.encryption_key_id);
  }

  return { receive, claimNextNotification, recoverStaleClaims, completeNotification, decodeNotification };
}
