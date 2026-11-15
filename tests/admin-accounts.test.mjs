import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createAdminAccount, resetAdminAccount, disableAdminAccount } from '../server/auth/accounts.mjs';

test('account CLI refuses noninteractive use before inspecting credentials or connecting', () => {
  const marker = 'ThisValueMustNotBePrinted12345';
  const run = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/admin-manage.mjs', import.meta.url)), '--manage-accounts'], {
    env: { ...process.env, ADMIN_OPERATIONS: 'interactive-confirmed', DB_PASSWORD: marker, ADMIN_MFA_KEY: marker },
    encoding: 'utf8', timeout: 5000,
  });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /Accountbeheer geweigerd/);
  assert.doesNotMatch(run.stdout + run.stderr, new RegExp(marker));
  assert.equal(run.stdout, '');
});

test('account audit migration never runs without the explicit migration gate', () => {
  const run = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/db-account-migrate.mjs', import.meta.url)), '--apply'], {
    env: { ...process.env, DB_SCHEMA_APPLY: '' }, encoding: 'utf8', timeout: 5000,
  });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /migration refused/);
});

test('invalid identifiers and roles are rejected before database access', async () => {
  const pool = { getConnection() { throw new Error('Database must not be accessed'); } };
  await assert.rejects(createAdminAccount({ pool, email: 'bad\naddress', role: 'sales' }), { code: 'INVALID_EMAIL' });
  await assert.rejects(createAdminAccount({ pool, email: 'terminal\u001b[2J@example.test', role: 'sales' }), { code: 'INVALID_EMAIL' });
  await assert.rejects(createAdminAccount({ pool, email: 'test@example.test', role: 'superuser' }), { code: 'INVALID_ROLE' });
  await assert.rejects(resetAdminAccount({ pool, userId: '../../owner' }), { code: 'INVALID_ACCOUNT' });
  await assert.rejects(disableAdminAccount({ pool, userId: 'owner' }), { code: 'INVALID_ACCOUNT' });
});
