/** Disposable MySQL account lifecycle tests; no Hostinger, real contacts or SMTP. */
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { loadConfig } from '../server/config.mjs';
import { createLeadPool } from '../server/db/pool.mjs';
import { applyInitialMigration } from '../scripts/db-migrate.mjs';
import { applyAdminMigration } from '../scripts/db-admin-migrate.mjs';
import { applyAccountMigration } from '../scripts/db-account-migrate.mjs';
import { createFirstAdmin } from '../server/auth/bootstrap.mjs';
import { createAdminStore } from '../server/auth/store.mjs';
import {
  createAdminAccount, resetAdminAccount, disableAdminAccount, revokeAdminSessions,
  listAdminAccounts, assertAccountManagementSchema,
} from '../server/auth/accounts.mjs';
import { verifyAdminPassword } from '../server/auth/security.mjs';

if (process.env.CI !== 'true' || process.env.NODE_ENV !== 'test' || process.env.DB_NAME !== 'aura_ci') {
  throw new Error('Account tests require the disposable CI MySQL database aura_ci.');
}
const sessionSecret = randomBytes(32).toString('hex');
const cfg = loadConfig({
  ...process.env, ADMIN_ENABLED: 'false', LEAD_STORAGE_MODE: 'mail',
  ADMIN_SESSION_SECRET: sessionSecret,
});
assert.equal(cfg.adminEnabled, false);
const pool = createLeadPool(cfg);
const enrollment = () => ({
  password: 'Fictief.Account.Alleen.CI.' + randomBytes(8).toString('hex'),
});
const create = (email, role = 'sales', prepared = enrollment()) => createAdminAccount({ pool, email, role, ...prepared });
const reset = (id, prepared, overridePool = pool) => resetAdminAccount({
  pool: overridePool, userId: id, ...prepared, sessionSecret,
});
const rowFor = async id => (await pool.execute('SELECT * FROM aura_admin_users WHERE id=?', [id]))[0][0];
const guardHash = key => createHmac('sha256', sessionSecret).update('aura:authguard:v1:').update(key).digest('hex');

try {
  await applyInitialMigration(pool);
  await applyAdminMigration(pool);
  const initial = await applyAccountMigration(pool);
  assert.equal(initial.applied, true);
  assert.equal((await applyAccountMigration(pool)).applied, false);
  await assertAccountManagementSchema(pool);
  const appliedChecksum = (await pool.execute('SELECT checksum FROM aura_schema_migrations WHERE version=?', ['003_account_audit']))[0][0].checksum;
  await pool.execute('UPDATE aura_schema_migrations SET checksum=? WHERE version=?', ['0'.repeat(64), '003_account_audit']);
  try { await assert.rejects(applyAccountMigration(pool), /checksum differs/); }
  finally { await pool.execute('UPDATE aura_schema_migrations SET checksum=? WHERE version=?', [appliedChecksum, '003_account_audit']); }
  // Resume a precisely matching partial DDL application instead of masking
  // unknown schema differences. This is ONLY a disposable database.
  await pool.execute('DELETE FROM aura_schema_migrations WHERE version=?', ['003_account_audit']);
  await pool.query('ALTER TABLE aura_admin_audit DROP INDEX idx_aura_admin_audit_target_time');
  assert.equal((await applyAccountMigration(pool)).applied, true);

  // The preceding auth suite uses the same disposable service. Reset only
  // its account fixtures; production is rejected above before connecting.
  await pool.execute('DELETE FROM aura_admin_sessions');
  await pool.execute('DELETE FROM aura_admin_users');
  await pool.execute('DELETE FROM aura_admin_login_guards');
  await pool.execute('DELETE FROM aura_admin_audit');
  await assert.rejects(create('unbootstrapped@example.test', 'admin'), { code: 'FIRST_OWNER_REQUIRED' });
  const ownerEnrollment = enrollment();
  const owner = await createFirstAdmin({ pool, email: 'account-owner@example.test', ...ownerEnrollment });
  const second = await create('account-admin2@example.test', 'admin');
  const salesEnrollment = enrollment();
  const sales = await create('account-sales@example.test', 'sales', salesEnrollment);
  assert.equal(sales.role, 'sales');
  assert.equal(sales.disabled, false);
  assert.equal((await listAdminAccounts(pool)).length, 3);
  assert.equal(Object.hasOwn((await listAdminAccounts(pool))[0], 'passwordHash'), false);
  await assert.rejects(create(' ACCOUNT-SALES@EXAMPLE.TEST ', 'sales'), { code: 'ACCOUNT_EXISTS' });
  await assert.rejects(create('bad-password@example.test', 'sales', { password: 'short' }), { code: 'PASSWORD_POLICY' });
  assert.equal((await listAdminAccounts(pool)).length, 3);
  const persisted = await rowFor(sales.id);
  assert.equal(await verifyAdminPassword(salesEnrollment.password, persisted.password_hash), true);
  assert.equal(Buffer.from(persisted.mfa_secret_encrypted).length, 0);
  assert.equal(Number(persisted.mfa_last_accepted_step), -1);

  const store = createAdminStore({ pool, sessionSecret, leadEncryptionKey: cfg.encryptionKey });
  const loginSales = prepared => store.login({
    email: sales.email, password: prepared.password, address: '192.0.2.10',
  });
  const session = await loginSales(salesEnrollment);
  assert.ok(session?.token);
  assert.equal((await store.currentSession(session.token)).id, sales.id);

  const failedReset = { password: 'short' };
  await assert.rejects(reset(sales.id, failedReset), { code: 'PASSWORD_POLICY' });
  assert.equal((await rowFor(sales.id)).password_hash, persisted.password_hash);
  assert.ok(await store.currentSession(session.token));

  const rollbackPool = {
    query: pool.query.bind(pool), execute: pool.execute.bind(pool),
    getConnection: async () => {
      const conn = await pool.getConnection();
      return {
        query: conn.query.bind(conn), beginTransaction: conn.beginTransaction.bind(conn),
        commit: conn.commit.bind(conn), rollback: conn.rollback.bind(conn), release: conn.release.bind(conn),
        execute: async (sql, params) => {
          if (sql.startsWith('INSERT INTO aura_admin_audit')) throw new Error('Injected audit outage');
          return conn.execute(sql, params);
        },
      };
    },
  };
  await assert.rejects(reset(sales.id, enrollment(), rollbackPool), /Injected audit outage/);
  assert.equal((await rowFor(sales.id)).password_hash, persisted.password_hash, 'Reset rolls back without audit');
  assert.ok(await store.currentSession(session.token), 'Session revocation rolls back with failed reset');

  const accountGuard = guardHash('email:' + sales.email);
  const sourceGuard = guardHash('ip:192.0.2.10');
  const newEnrollment = enrollment();
  const recovered = await reset(sales.id, newEnrollment);
  assert.equal(recovered.revokedSessions, 1);
  assert.equal(await store.currentSession(session.token), null);
  const newRow = await rowFor(sales.id);
  assert.equal(await verifyAdminPassword(salesEnrollment.password, newRow.password_hash), false);
  assert.equal(await verifyAdminPassword(newEnrollment.password, newRow.password_hash), true);
  assert.equal(Buffer.from(newRow.mfa_secret_encrypted).length, 0);
  assert.equal((await pool.execute('SELECT guard_hash FROM aura_admin_login_guards WHERE guard_hash=?', [accountGuard]))[0].length, 0);
  assert.equal((await pool.execute('SELECT guard_hash FROM aura_admin_login_guards WHERE guard_hash=?', [sourceGuard]))[0].length, 1);
  const renewed = await loginSales(newEnrollment);
  assert.ok(renewed?.token);
  assert.equal((await revokeAdminSessions({ pool, userId: sales.id })).revokedSessions, 1);
  assert.equal(await store.currentSession(renewed.token), null);
  assert.equal((await rowFor(sales.id)).disabled_at, null);

  const beforeDisable = await loginSales(newEnrollment);
  assert.ok(beforeDisable?.token);
  const disabled = await disableAdminAccount({ pool, userId: sales.id });
  assert.equal(disabled.changed, true);
  assert.equal(disabled.revokedSessions, 1);
  assert.equal(await store.currentSession(beforeDisable.token), null);
  assert.equal(await loginSales(newEnrollment), null, 'Disabled accounts cannot authenticate with a valid password');
  assert.equal((await disableAdminAccount({ pool, userId: sales.id })).changed, false);
  assert.equal((await reset(sales.id, enrollment())).disabled, true, 'Credential reset cannot silently reactivate an account');

  // A login can pass credential verification before a terminal reset. Verify
  // it cannot commit a new session after the reset revoked existing sessions.
  const raceEnrollment = enrollment();
  const race = await create('account-race@example.test', 'sales', raceEnrollment);
  const raceReplacement = enrollment();
  let resetInjected = false;
  const racePool = {
    query: pool.query.bind(pool), execute: pool.execute.bind(pool),
    getConnection: async () => {
      if (!resetInjected) { resetInjected = true; await reset(race.id, raceReplacement); }
      return pool.getConnection();
    },
  };
  const racingStore = createAdminStore({ pool: racePool, sessionSecret, leadEncryptionKey: cfg.encryptionKey });
  // The in-flight login must fail when the password is reset after its
  // initial read but before the account row is locked.
  const racingLogin = await racingStore.login({
    email: race.email, password: raceEnrollment.password, address: '192.0.2.11',
  });
  assert.equal(resetInjected, true);
  assert.equal(racingLogin, null);
  assert.equal(Number((await pool.execute('SELECT COUNT(*) AS total FROM aura_admin_sessions WHERE user_id=?', [race.id]))[0][0].total), 0);

  const disables = await Promise.allSettled([
    disableAdminAccount({ pool, userId: owner.id }), disableAdminAccount({ pool, userId: second.id }),
  ]);
  assert.equal(disables.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(disables.find(result => result.status === 'rejected').reason.code, 'LAST_ACTIVE_ADMIN');
  const activeAdmins = (await listAdminAccounts(pool)).filter(account => account.role === 'admin' && !account.disabled);
  assert.equal(activeAdmins.length, 1);
  await assert.rejects(disableAdminAccount({ pool, userId: activeAdmins[0].id }), { code: 'LAST_ACTIVE_ADMIN' });
  const [audits] = await pool.query("SELECT actor_user_id,target_user_id,action,result_code FROM aura_admin_audit WHERE action LIKE 'terminal_%'");
  assert.ok(audits.length >= 10);
  assert.ok(audits.every(row => row.actor_user_id === null && row.target_user_id), 'Terminal actions record the subject without impersonating it');
  assert.doesNotMatch(JSON.stringify(audits), /@|password_hash|totpSecret|scrypt\$/);
  console.log('PASS account migration/retry, provisioning, password-only validation, duplicate prevention, atomic recovery, session revocation, audit rollback, login/reset race and last-admin protection');
} finally { await pool.end(); }
