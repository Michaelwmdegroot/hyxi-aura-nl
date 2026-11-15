import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runOwnerBootstrap } from '../scripts/admin-bootstrap.mjs';

const preparedEnv = {
  NODE_ENV: 'test', LEAD_STORAGE_MODE: 'mail', ADMIN_ENABLED: 'false',
  DB_HOST: '127.0.0.1', DB_NAME: 'offline_test_fixture', DB_USER: 'test-fixture', DB_PASSWORD: 'never-connect',
  ADMIN_SESSION_SECRET: 'offline-fixture-session-secret-at-least-32-bytes',
  ADMIN_MFA_KEY: Buffer.alloc(32, 6).toString('base64'),
};

test('owner CLI refuses noninteractive use and does not echo supplied configuration', () => {
  const marker = 'DoNotPrintThisFixtureCredential123456';
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/admin-bootstrap.mjs', import.meta.url)), '--create-first-owner'], {
    env: { ...process.env, ADMIN_BOOTSTRAP: 'interactive-confirmed', DB_PASSWORD: marker }, encoding: 'utf8', timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Owner bootstrap refused/);
  assert.doesNotMatch(result.stdout + result.stderr, new RegExp(marker));
});

test('incomplete owner setup is rejected before creating a database connection or asking secrets', async () => {
  let connections = 0, prompts = 0;
  await assert.rejects(runOwnerBootstrap({
    env: { ...preparedEnv, ADMIN_MFA_KEY: '' }, requireTerminal() {},
    createPool() { connections++; throw new Error('Unexpected database connection'); },
    visible() { prompts++; }, hidden() { prompts++; }, writeLine() {},
  }), /Complete DB and independent admin secrets/);
  assert.equal(connections, 0);
  assert.equal(prompts, 0);
});

test('first owner can be prepared in mail mode with admin disabled after schema003 validation', async () => {
  const order = [], hiddenLabels = [];
  const fakePool = {
    query: async () => [[{ total: 0 }]],
    end: async () => { order.push('closed'); },
  };
  const result = await runOwnerBootstrap({
    env: preparedEnv, requireTerminal() { order.push('tty'); },
    createPool(config) {
      assert.equal(config.storageMode, 'mail');
      assert.equal(config.adminEnabled, false);
      assert.equal(config.adminConfigured, false);
      order.push('pool'); return fakePool;
    },
    checkSchema: async pool => { assert.equal(pool, fakePool); order.push('schema003'); },
    visible: async () => { order.push('email'); return 'bootstrap@example.test'; },
    hidden: async label => {
      hiddenLabels.push(label);
      return hiddenLabels.length === 1 ? 'OfflineFixturePassword2026!' : '123456';
    },
    writeLine() {},
    createOwner: async args => {
      assert.equal(args.pool, fakePool);
      assert.equal(args.confirmationCode, '123456');
      assert.match(args.totpSecret, /^[A-Z2-7]{32}$/);
      assert.equal(args.mfaKey, preparedEnv.ADMIN_MFA_KEY);
      order.push('owner'); return { email: args.email };
    },
  });
  assert.equal(result.email, 'bootstrap@example.test');
  assert.deepEqual(order, ['tty', 'pool', 'schema003', 'email', 'owner', 'closed']);
  assert.equal(hiddenLabels.length, 2, 'One login password and the MFA code use hidden input');
});

test('schema failure closes the pool before any enrollment prompts', async () => {
  let closed = false, prompts = 0;
  await assert.rejects(runOwnerBootstrap({
    env: preparedEnv, requireTerminal() {},
    createPool: () => ({ end: async () => { closed = true; } }),
    checkSchema: async () => { throw new Error('Schema 003 missing'); },
    visible() { prompts++; }, hidden() { prompts++; }, writeLine() {},
  }), /Schema 003 missing/);
  assert.equal(closed, true);
  assert.equal(prompts, 0);
});

test('weak password is rejected before MFA; no double-entry is required', async () => {
  const prompts = [], output = [];
  const fakePool = {
    query: async () => [[{ total: 0 }]],
    end: async () => {},
  };
  let ownerCreated = false;
  await assert.rejects(runOwnerBootstrap({
    env: preparedEnv,
    requireTerminal() {},
    createPool: () => fakePool,
    checkSchema: async () => {},
    visible: async () => 'bootstrap@example.test',
    hidden: async label => { prompts.push(label); return 'short'; },
    writeLine: line => output.push(line),
    createOwner: async () => { ownerCreated = true; },
  }), /PASSWORD_POLICY/);
  assert.equal(prompts.length, 1);
  assert.equal(prompts[0].includes('Herhaal'), false);
  assert.equal(ownerCreated, false);
  assert.equal(output.some(line => line.includes('Eenmalige geheime instelsleutel')), false);
});
