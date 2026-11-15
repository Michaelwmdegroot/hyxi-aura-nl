/** Trusted-terminal account operations. This module has no public HTTP route. */
import { createHmac, randomUUID } from 'node:crypto';
import { hashAdminPassword } from './security.mjs';
import { assertAdminSchema } from './store.mjs';

const roles = new Set(['admin', 'sales']);
const userIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
// Match first-owner bootstrap so provisioning cannot race initial setup.
const lockName = 'aura_beheer_first_owner';

export class AccountOperationError extends Error {
  constructor(code) { super('Account operation refused: ' + code); this.code = code; }
}
const fail = code => { throw new AccountOperationError(code); };
const accountView = row => ({
  id: row.id, email: row.login_email, role: row.role, disabled: Boolean(row.disabled_at),
});

function emailValue(input) {
  const value = typeof input === 'string' ? input.trim().toLowerCase() : '';
  if (value.length < 6 || value.length > 254 || /[\u0000-\u001f\u007f-\u009f]/.test(value) ||
      !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value)) fail('INVALID_EMAIL');
  return value;
}
function validUserId(userId) {
  if (typeof userId !== 'string' || !userIdPattern.test(userId)) fail('INVALID_ACCOUNT');
}
function validSessionSecret(secret) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) fail('INVALID_CONFIGURATION');
}
async function credentials({ password }) {
  try { return {passwordHash: await hashAdminPassword(password)}; }
  catch { fail('PASSWORD_POLICY'); }
}

export async function assertAccountManagementSchema(pool) {
  if (!pool || typeof pool.getConnection !== 'function') fail('INVALID_CONFIGURATION');
  await assertAdminSchema(pool);
  await pool.query('SELECT target_user_id FROM aura_admin_audit LIMIT 0');
  const [rows] = await pool.execute('SELECT version FROM aura_schema_migrations WHERE version=? LIMIT 1', ['003_account_audit']);
  if (rows.length !== 1) fail('SCHEMA_NOT_READY');
}

async function withAccounts(pool, operation) {
  await assertAccountManagementSchema(pool);
  const conn = await pool.getConnection();
  let locked = false;
  try {
    const [locks] = await conn.execute('SELECT GET_LOCK(?,10) AS acquired', [lockName]);
    if (Number(locks[0]?.acquired) !== 1) fail('BUSY');
    locked = true;
    await conn.beginTransaction();
    const [accounts] = await conn.query('SELECT id,login_email,role,disabled_at FROM aura_admin_users ORDER BY id FOR UPDATE');
    const result = await operation(conn, accounts);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback().catch(() => {});
    if (error?.code === 'ER_DUP_ENTRY') fail('ACCOUNT_EXISTS');
    throw error;
  } finally {
    if (locked) await conn.execute('SELECT RELEASE_LOCK(?)', [lockName]).catch(() => {});
    conn.release();
  }
}
async function audit(conn, targetId, action, result = 'ok') {
  // The trusted terminal is the operator; never pretend the target user
  // authenticated. No e-mail address, credential or free text is logged.
  await conn.execute(
    'INSERT INTO aura_admin_audit (actor_user_id,target_user_id,action,result_code) VALUES (NULL,?,?,?)',
    [targetId, action, result],
  );
}
async function revoke(conn, userId) {
  const [result] = await conn.execute(
    'UPDATE aura_admin_sessions SET revoked_at=UTC_TIMESTAMP(3) WHERE user_id=? AND revoked_at IS NULL', [userId],
  );
  return Number(result.affectedRows);
}
function findAccount(accounts, userId) {
  const account = accounts.find(row => row.id === userId);
  if (!account) fail('ACCOUNT_NOT_FOUND');
  return account;
}

export async function listAdminAccounts(pool) {
  await assertAccountManagementSchema(pool);
  const [rows] = await pool.query('SELECT id,login_email,role,disabled_at FROM aura_admin_users ORDER BY created_at,id');
  return rows.map(accountView);
}

export async function createAdminAccount({ pool, email, role, password }) {
  const loginEmail = emailValue(email);
  if (!roles.has(role)) fail('INVALID_ROLE');
  const id = randomUUID();
  const prepared = await credentials({ password });
  return withAccounts(pool, async (conn, accounts) => {
    if (!accounts.some(row => row.role === 'admin' && !row.disabled_at)) fail('FIRST_OWNER_REQUIRED');
    if (accounts.some(row => row.login_email.toLowerCase() === loginEmail)) fail('ACCOUNT_EXISTS');
    await conn.execute(
      'INSERT INTO aura_admin_users (id,login_email,password_hash,role,mfa_secret_encrypted,mfa_last_accepted_step) VALUES (?,?,?,?,?,?)',
      [id, loginEmail, prepared.passwordHash, role, Buffer.alloc(0), -1],
    );
    await audit(conn, id, 'terminal_account_create');
    return { id, email: loginEmail, role, disabled: false };
  });
}

export async function resetAdminAccount({ pool, userId, password, sessionSecret }) {
  validUserId(userId);
  validSessionSecret(sessionSecret);
  const prepared = await credentials({ password });
  return withAccounts(pool, async (conn, accounts) => {
    const account = findAccount(accounts, userId);
    await conn.execute(
      'UPDATE aura_admin_users SET password_hash=? WHERE id=?',
      [prepared.passwordHash, userId],
    );
    const revokedSessions = await revoke(conn, userId);
    // Remove only this account's login guard. A shared source-IP guard
    // deliberately stays intact after recovery.
    const guard = createHmac('sha256', sessionSecret).update('aura:authguard:v1:email:').update(account.login_email).digest('hex');
    await conn.execute('DELETE FROM aura_admin_login_guards WHERE guard_hash=?', [guard]);
    await audit(conn, userId, 'terminal_account_reset');
    return { ...accountView(account), revokedSessions };
  });
}

export async function disableAdminAccount({ pool, userId }) {
  validUserId(userId);
  return withAccounts(pool, async (conn, accounts) => {
    const account = findAccount(accounts, userId);
    if (!account.disabled_at && account.role === 'admin' &&
        accounts.filter(row => row.role === 'admin' && !row.disabled_at).length <= 1) fail('LAST_ACTIVE_ADMIN');
    const changed = !account.disabled_at;
    if (changed) await conn.execute('UPDATE aura_admin_users SET disabled_at=UTC_TIMESTAMP(3) WHERE id=?', [userId]);
    const revokedSessions = await revoke(conn, userId);
    await audit(conn, userId, 'terminal_account_disable', changed ? 'ok' : 'already_disabled');
    return { ...accountView(account), disabled: true, changed, revokedSessions };
  });
}

export async function revokeAdminSessions({ pool, userId }) {
  validUserId(userId);
  return withAccounts(pool, async (conn, accounts) => {
    const account = findAccount(accounts, userId);
    const revokedSessions = await revoke(conn, userId);
    await audit(conn, userId, 'terminal_sessions_revoke');
    return { ...accountView(account), revokedSessions };
  });
}
