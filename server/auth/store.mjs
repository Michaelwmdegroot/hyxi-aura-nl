import { createHmac } from 'node:crypto';
import { verifyAdminPassword, hashAdminPassword, newSessionToken, hashSessionToken, decryptTotp, verifyTotp } from './security.mjs';
import { openLead, parseEncryptionKey } from '../db/crypto.mjs';
import { assertAdminStructure, assertMigrationChecksum } from '../db/schema-check.mjs';
import { createAdminOperations } from './operations.mjs';

const STATUSES = new Set(['new','contact_planned','in_progress','quote_requested','quote_sent','won','lost','not_suitable']);
const VALID_ID = /^AURA-[a-f0-9-]{36}$/;
const ADMIN_ROLES = new Set(['admin','sales']);
const DUMMY_PASSWORD = 'NotAnActualAccount_UsedOnlyForScryptTiming';
let dummyHashPromise;
const toIso = value => new Date(value).toISOString();

function normalizeEmail(email) {
  const value = typeof email === 'string' ? email.trim().toLowerCase() : '';
  return value.length <= 254 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value) ? value : null;
}
function canRead(actor, row) {
  return actor.role === 'admin' || (actor.role === 'sales' && row.assigned_user_id === actor.id);
}
export class AdminRateLimitError extends Error { constructor() { super('Authentication rate-limited.'); this.code='RATE_LIMIT'; } }
export class AdminNotFoundError extends Error { constructor() { super('Resource unavailable.'); this.code='NOT_FOUND'; } }
export class AdminInputError extends Error { constructor() { super('Invalid status.'); this.code='BAD_STATUS'; } }

export async function assertAdminSchema(pool) {
  await assertAdminStructure(pool);
  await assertMigrationChecksum(pool,'002_admin_auth');
}

export function createAdminStore({ pool, sessionSecret, mfaKey, leadEncryptionKey, now = Date.now }) {
  if (!pool || typeof pool.getConnection !== 'function') throw new Error('MySQL pool required.');
  if (typeof sessionSecret !== 'string' || Buffer.byteLength(sessionSecret, 'utf8') < 32) {
    throw new Error('Strong ADMIN_SESSION_SECRET required.');
  }
  if (typeof mfaKey !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(mfaKey) ||
      Buffer.from(mfaKey,'base64').length !== 32 || Buffer.from(mfaKey,'base64').toString('base64') !== mfaKey) {
    throw new Error('ADMIN_MFA_KEY must be canonical 32-byte base64.');
  }
  const leadKey = parseEncryptionKey(leadEncryptionKey);
  const sessionHash = token => hashSessionToken(token, sessionSecret);
  const guardHash = value => createHmac('sha256', sessionSecret).update('aura:authguard:v1:').update(value).digest('hex');

  async function countAttempts(email, address) {
    // Separate HMAC counters per login identifier and source address. The DB
    // serializes increments; counters survive restarts and never contain PII.
    // Reject a blocked source before it can create new identifier counters.
    for (const item of [{ key: 'ip:' + (address || '-'), cap: 25 },
                        { key: 'email:' + (email || '-'), cap: 6 }]) {
      const hash = guardHash(item.key);
      await pool.execute(
        'UPDATE aura_admin_login_guards SET failures=0,window_started_at=UTC_TIMESTAMP(3) WHERE guard_hash=? AND window_started_at < DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE)',
        [hash],
      );
      await pool.execute(
        'INSERT INTO aura_admin_login_guards (guard_hash,failures,window_started_at) VALUES (?,1,UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE failures=LEAST(failures+1,65535)',
        [hash],
      );
      const [rows] = await pool.execute('SELECT failures FROM aura_admin_login_guards WHERE guard_hash=?', [hash]);
      if (Number(rows[0].failures) > item.cap) throw new AdminRateLimitError();
    }
  }

  async function login({ email, password, code, address }) {
    const normalized = normalizeEmail(email);
    await countAttempts(normalized, address);
    const [rows] = normalized
      ? await pool.execute('SELECT id,login_email,password_hash,role,mfa_secret_encrypted,mfa_last_accepted_step,disabled_at FROM aura_admin_users WHERE login_email=? AND BINARY login_email=BINARY ? LIMIT 1', [normalized,normalized])
      : [[]];
    const user = rows[0] || null;
    if (!dummyHashPromise) dummyHashPromise = hashAdminPassword(DUMMY_PASSWORD);
    const passwordOk = await verifyAdminPassword(password, user?.password_hash || await dummyHashPromise);
    if (!user || user.disabled_at || !ADMIN_ROLES.has(user.role) || !passwordOk) return null;
    let step;
    try {
      const secret = decryptTotp(user.mfa_secret_encrypted, user.id, mfaKey);
      step = verifyTotp(secret, code, now(), Number(user.mfa_last_accepted_step));
    } catch { return null; }
    if (step === null) return null;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [updated] = await conn.execute(
        'UPDATE aura_admin_users SET mfa_last_accepted_step=? WHERE id=? AND mfa_last_accepted_step < ? AND disabled_at IS NULL AND password_hash=? AND mfa_secret_encrypted=?',
        [step,user.id,step,user.password_hash,user.mfa_secret_encrypted],
      );
      if (updated.affectedRows !== 1) {
        await conn.rollback();
        return null;
      }
      const token = newSessionToken();
      await conn.execute(
        'INSERT INTO aura_admin_sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 8 HOUR),UTC_TIMESTAMP(3))',
        [sessionHash(token),user.id],
      );
      await conn.execute(
        'INSERT INTO aura_admin_audit (actor_user_id,action,result_code) VALUES (?,?,?)',
        [user.id,'login','ok'],
      );
      await conn.commit();
      return { token, user: { id:user.id, email:user.login_email, role:user.role } };
    } catch (error) {
      await conn.rollback().catch(() => {});
      throw error;
    } finally { conn.release(); }
  }

  async function currentSession(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
    const [rows] = await pool.execute(
      'SELECT u.id,u.login_email,u.role FROM aura_admin_sessions s JOIN aura_admin_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at > UTC_TIMESTAMP(3) AND u.disabled_at IS NULL LIMIT 1',
      [sessionHash(token)],
    );
    const user = rows[0];
    return user && ADMIN_ROLES.has(user.role)
      ? { id:user.id, email:user.login_email, role:user.role } : null;
  }

  async function logout(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
    await pool.execute(
      'UPDATE aura_admin_sessions SET revoked_at=UTC_TIMESTAMP(3) WHERE token_hash=? AND revoked_at IS NULL',
      [sessionHash(token)],
    );
  }

  async function summary(actor) {
    const filter = actor.role === 'admin' ? '' : ' WHERE assigned_user_id=?';
    const args = actor.role === 'admin' ? [] : [actor.id];
    const [rows] = await pool.execute('SELECT status,COUNT(*) AS total FROM aura_leads' + filter + ' GROUP BY status', args);
    const statuses = Object.fromEntries([...STATUSES].map(x => [x,0]));
    let total=0;
    for (const row of rows) {
      if (Object.hasOwn(statuses,row.status)) statuses[row.status]=Number(row.total);
      total += Number(row.total);
    }
    const [notifications] = await pool.execute(
      'SELECT o.delivery_status,COUNT(*) AS total FROM aura_notification_outbox o JOIN aura_leads l ON l.id=o.lead_id' +
        (actor.role==='admin' ? '' : ' WHERE l.assigned_user_id=?') + ' GROUP BY o.delivery_status',
      args,
    );
    return {total,statuses,notifications:Object.fromEntries(notifications.map(r=>[r.delivery_status,Number(r.total)]))};
  }

  async function listLeads(actor,{status='',page=1}={}) {
    if(status && !STATUSES.has(status)) throw new AdminInputError();
    const current=Number.isSafeInteger(page)&&page>0?Math.min(100,page):1;
    const where=[],params=[];
    if(actor.role!=='admin'){where.push('l.assigned_user_id=?');params.push(actor.id);}
    if(status){where.push('l.status=?');params.push(status);}
    const condition=where.length?' WHERE '+where.join(' AND '):'';
    const [rows]=await pool.query(
      "SELECT l.id,l.request_id,l.status,l.request_type,l.source_domain,l.created_at,l.assigned_user_id,o.delivery_status FROM aura_leads l LEFT JOIN aura_notification_outbox o ON o.lead_id=l.id AND o.event_type='lead_received'"+
      condition+' ORDER BY l.created_at DESC,l.id DESC LIMIT ? OFFSET ?',
      [...params,20,(current-1)*20],
    );
    return {page:current,items:rows.map(r=>({
      id:r.id,requestId:r.request_id,status:r.status,requestType:r.request_type,
      source:r.source_domain,createdAt:toIso(r.created_at),
      assignedTo:r.assigned_user_id,deliveryStatus:r.delivery_status||'unknown',
    }))};
  }

  async function getLead(actor,requestId) {
    if(!VALID_ID.test(requestId)) throw new AdminNotFoundError();
    const [rows]=await pool.execute(
      "SELECT l.id,l.request_id,l.status,l.request_type,l.source_domain,l.created_at,l.assigned_user_id,l.encrypted_payload,l.encryption_key_id,o.delivery_status,o.attempt_count,o.last_error_code FROM aura_leads l LEFT JOIN aura_notification_outbox o ON o.lead_id=l.id AND o.event_type='lead_received' WHERE l.request_id=? LIMIT 1",
      [requestId],
    );
    const r=rows[0];
    if(!r || !canRead(actor,r)) throw new AdminNotFoundError();
    const lead=openLead(r.encrypted_payload,r.id,leadKey,r.encryption_key_id);
    await pool.execute(
      'INSERT INTO aura_admin_audit (actor_user_id,lead_id,action,result_code) VALUES (?,?,?,?)',
      [actor.id,r.id,'lead_view','ok'],
    );
    return {
      id:r.id,requestId:r.request_id,status:r.status,requestType:r.request_type,
      source:r.source_domain,createdAt:toIso(r.created_at),
      assignedTo:r.assigned_user_id,
      notification:{status:r.delivery_status||'unknown',attempts:Number(r.attempt_count||0),errorCode:r.last_error_code||null},
      contact:{fullName:lead.fullName,email:lead.email,phone:lead.phone,postcode:lead.postcode},
      profile:lead.profile,attribution:lead.attribution||{},
    };
  }

  async function changeStatus(actor,requestId,nextStatus) {
    if(!VALID_ID.test(requestId)) throw new AdminNotFoundError();
    if(!STATUSES.has(nextStatus)) throw new AdminInputError();
    const conn=await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows]=await conn.execute('SELECT id,status,assigned_user_id FROM aura_leads WHERE request_id=? LIMIT 1 FOR UPDATE',[requestId]);
      const r=rows[0];
      if(!r || !canRead(actor,r)) throw new AdminNotFoundError();
      const changed=r.status!==nextStatus;
      if(changed){
        await conn.execute('UPDATE aura_leads SET status=? WHERE id=?',[nextStatus,r.id]);
        await conn.execute(
          'INSERT INTO aura_lead_events (lead_id,event_type,actor_type,actor_id,metadata_json) VALUES (?,?,?,?,?)',
          [r.id,'status_changed','admin',actor.id,JSON.stringify({from:r.status,to:nextStatus})],
        );
        await conn.execute(
          'INSERT INTO aura_admin_audit (actor_user_id,lead_id,action,result_code) VALUES (?,?,?,?)',
          [actor.id,r.id,'status_change','ok'],
        );
      }
      await conn.commit();
      return {requestId,status:nextStatus,changed};
    } catch(error) {
      await conn.rollback().catch(()=>{});
      throw error;
    } finally {conn.release();}
  }

  return {login,currentSession,logout,summary,listLeads,getLead,changeStatus,...createAdminOperations({pool})};
}
