/**
 * A real MySQL 8 integration suite runs only in an isolated GitHub Actions
 * service, with fake applicants and an injected SMTP stub. It never contacts
 * production databases or sends mail.
 */
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../server/app.mjs';
import { loadConfig } from '../server/config.mjs';
import { applyInitialMigration } from '../scripts/db-migrate.mjs';
import { applyNotificationMigration } from '../scripts/db-notification-migrate.mjs';
import { createLeadPool, assertLeadSchema } from '../server/db/pool.mjs';
import { createMysqlLeadStore, LeadConflictError } from '../server/db/store.mjs';
import { createNotificationWorker } from '../server/db/worker.mjs';
import { sealLead, openLead, parseEncryptionKey, parseHashKey } from '../server/db/crypto.mjs';

if (process.env.DB_NAME !== 'aura_ci' || process.env.NODE_ENV !== 'test' || process.env.CI !== 'true') {
  // CI=true is deliberately required before any tests perform DDL.
  throw new Error('Database integration tests require isolated CI MySQL database aura_ci.');
}

const config = loadConfig({ ...process.env, SALES_NOTIFICATION_TO: process.env.SALES_NOTIFICATION_TO || 'sales@example.test' });
assert.equal(config.dbConfigured, true, 'Test service config is complete');
assert.equal(config.storageMode, 'database');
assert.equal(config.leadEnabled, true);
assert.equal(config.salesNotificationConfigured, true);
const pool = createLeadPool(config);

const sample = name => ({
  fullName: name, email: 'aura-test@example.test', phone: '0612345678',
  city: 'Leiden', postcode: '1234AB', consent: true, website: '',
  profile: {
    solar: 'planned', annualUsage: 4200, goal: 'backup', phase: 'three',
    moduleType: 9, moduleCount: 2,
  },
  attribution: { utm_source: 'ci', utm_medium: 'test' },
});

async function count(table) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM ' + table);
  return Number(rows[0].total);
}

async function status(requestId) {
  const [rows] = await pool.execute(
    'SELECT o.delivery_status, o.attempt_count, o.last_error_code FROM aura_notification_outbox o JOIN aura_leads l ON l.id = o.lead_id WHERE l.request_id = ? LIMIT 1',
    [requestId],
  );
  return rows[0] || null;
}

async function appFixture(store) {
  const fakeTransport = { async sendMail() { throw new Error('Test HTTP API must not send email'); } };
  let wakes = 0;
  const app = createApp({
    config,
    transport: fakeTransport,
    leadStore: store,
    notificationWorker: { wake() { wakes++; } },
    distDir: new URL('../dist', import.meta.url).pathname,
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  const response = await fetch(base + '/api/config');
  const session = await response.json();
  const cookie = response.headers.get('set-cookie').split(';')[0];
  async function post(body, key = randomUUID(), extraHeaders = {}) {
    const result = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: {
        Origin: 'https://hyxi-aura.nl', Cookie: cookie,
        'Content-Type': 'application/json',
        'X-CSRF-Token': session.csrfToken,
        'Idempotency-Key': key,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });
    return { status: result.status, data: await result.json() };
  }
  return { post, base, get wakes() { return wakes; }, close: () => new Promise(resolve => server.close(resolve)) };
}

try {
  const first = await applyInitialMigration(pool);
  assert.equal(first.applied, true, 'First isolated migration must apply');
  await assertLeadSchema(pool);
  const second = await applyInitialMigration(pool);
  assert.equal(second.applied, false, 'Applying the same migration must be idempotent');
  await applyNotificationMigration(pool);
  assert.equal(await count('aura_leads'), 0);

  const key = parseEncryptionKey(config.encryptionKey);
  const id = randomUUID();
  const envelope = sealLead(sample('Fictional Alpha'), id, key);
  assert.deepEqual(openLead(envelope, id, key), sample('Fictional Alpha'));
  assert.ok(!envelope.includes(Buffer.from('Fictional Alpha')), 'PII must not be in plaintext ciphertext');
  assert.throws(() => openLead(envelope, randomUUID(), key), /Lead decryption/);
  assert.throws(() => openLead(Buffer.from(envelope.map((byte, i) => i === 22 ? byte ^ 1 : byte)), id, key), /Lead decryption/);
  assert.throws(() => parseEncryptionKey('not-a-key'), /32-byte/);
  assert.throws(() => parseHashKey('too-short'), /32 bytes/);

  const store = createMysqlLeadStore({
    pool, encryptionKey: config.encryptionKey, hashSecret: config.hashSecret, salesNotificationEnabled: config.salesNotificationConfigured,
  });
  const initial = await store.receive({ lead: sample('Fictional Alpha'), requestKey: randomUUID() });
  assert.match(initial.requestId, /^AURA-[a-f0-9-]{36}$/);
  assert.equal(initial.duplicate, false);
  assert.equal(await count('aura_leads'), 1);
  assert.equal(await count('aura_submission_keys'), 1);
  assert.equal(await count('aura_lead_events'), 1);
  assert.equal(await count('aura_notification_outbox'), 2);

  const [sealed] = await pool.query('SELECT encrypted_payload FROM aura_leads LIMIT 1');
  assert.ok(!sealed[0].encrypted_payload.includes(Buffer.from('Fictional Alpha')));

  const persistedKey = randomUUID();
  const secondLead = await store.receive({ lead: sample('Fictional Beta'), requestKey: persistedKey });
  const replay = await createMysqlLeadStore({
    pool, encryptionKey: config.encryptionKey, hashSecret: config.hashSecret, salesNotificationEnabled: config.salesNotificationConfigured,
  }).receive({ lead: sample('Fictional Beta'), requestKey: persistedKey });
  assert.equal(replay.requestId, secondLead.requestId, 'Retry after simulated process restart must not create a lead');
  assert.equal(replay.duplicate, true);
  await assert.rejects(
    () => store.receive({ lead: sample('Fictional Other'), requestKey: persistedKey }),
    error => error instanceof LeadConflictError,
  );
  assert.equal(await count('aura_leads'), 2);

  // Parallel retries using exactly the same browser key must commit only once.
  const parallelKey = randomUUID();
  const parallel = await Promise.all(Array.from({ length: 5 }, () =>
    store.receive({ lead: sample('Fictional Parallel'), requestKey: parallelKey })));
  assert.equal(new Set(parallel.map(x => x.requestId)).size, 1);
  assert.equal(parallel.filter(x => !x.duplicate).length, 1);
  assert.equal(await count('aura_leads'), 3);

  // Process the previously committed notifications with no actual SMTP.
  const accepted = [];
  const mockMail = { async sendMail(message) {
    accepted.push(message);
    return { accepted: [message.to] };
  } };
  const worker = createNotificationWorker({ store, transport: mockMail, config });
  assert.equal(await worker.flush(8), 6);
  assert.equal(accepted.length, 6);
  for (const message of accepted) {
    assert.ok(['leads@example.test', 'sales@example.test'].includes(message.to));
    if (message.to === 'leads@example.test') {
      assert.equal(message.subject, 'Fictional Alpha | Leiden');
      assert.match(message.text, /Verkende opstelling: 2 × BAT-Q9/);
    } else {
      assert.equal(message.subject, 'Nieuwe HYXI AURA lead | Fictional Alpha | Leiden');
      assert.match(message.text, /Gekozen HYXI AURA-pakket: 18 kWh/);
    }
  }
  assert.equal(await worker.flush(8), 0, 'SMTP acceptance must not resend accepted notifications');
  assert.equal((await status(initial.requestId)).delivery_status, 'accepted');

  // Prove rollback when the last INSERT in the transaction is rejected.
  // Existing outbox records have been processed and attempt_count > 0.
  // A new pending outbox row starts at 0 and violates this test-only CHECK.
  // No SUPER privileges, triggers, or production data are required.
  await pool.query('ALTER TABLE aura_notification_outbox ADD CONSTRAINT ci_reject_outbox CHECK (attempt_count > 0)');
  const beforeRollback = await count('aura_leads');
  const beforeRollbackOutbox = await count('aura_notification_outbox');
  try {
    await assert.rejects(
      () => store.receive({ lead: sample('Fictional Rollback'), requestKey: randomUUID() }),
      /ci_reject_outbox|Check constraint/,
    );
  } finally {
    await pool.query('ALTER TABLE aura_notification_outbox DROP CHECK ci_reject_outbox');
  }
  assert.equal(await count('aura_leads'), beforeRollback, 'Lead insert rolled back');
  assert.equal(await count('aura_notification_outbox'), beforeRollbackOutbox, 'Outbox insert rolled back');

  const willRetry = await store.receive({ lead: sample('Fictional Retry'), requestKey: randomUUID() });
  const rejectOnce = createNotificationWorker({ store, config, transport: {
    async sendMail() { throw Object.assign(new Error('offline before greeting'), { code: 'ECONNREFUSED' }); },
  } });
  assert.equal(await rejectOnce.flush(8), 2);
  assert.equal((await status(willRetry.requestId)).delivery_status, 'retry_wait');
  assert.equal((await status(willRetry.requestId)).attempt_count, 1);
  assert.equal(await rejectOnce.flush(8), 0, 'Not retried before backoff expires');

  const ambiguous = await store.receive({ lead: sample('Fictional Ambiguous'), requestKey: randomUUID() });
  const uncertainWorker = createNotificationWorker({ store, config, transport: {
    async sendMail() { throw Object.assign(new Error('connection lost after DATA'), { code: 'ECONNECTION' }); },
  } });
  assert.equal(await uncertainWorker.flush(8), 2);
  assert.equal((await status(ambiguous.requestId)).delivery_status, 'uncertain');
  assert.equal(await uncertainWorker.flush(8), 0, 'Unknown acceptance must never auto-resend');

  const fixture = await appFixture(store);
  try {
    const health = await (await fetch(fixture.base + '/api/health')).json();
    assert.equal(health.leadEnabled, true);
    const key = randomUUID();
    const result = await fixture.post(sample('Fictional API'), key);
    assert.equal(result.status, 201);
    assert.match(result.data.requestId, /^AURA-/);
    assert.equal(fixture.wakes, 1);
    const repeated = await fixture.post(sample('Fictional API'), key);
    assert.equal(repeated.status, 200);
    assert.equal(repeated.data.requestId, result.data.requestId);
    assert.equal(fixture.wakes, 1);
    const invalid = await fixture.post({ ...sample('Fictional Invalid'), consent: false });
    assert.equal(invalid.status, 422);
    const changed = await fixture.post(sample('Fictional Different'), key);
    assert.equal(changed.status, 409);
  } finally {
    await fixture.close();
  }

  const broken = await appFixture({ receive: async () => { throw new Error('Simulated DB outage'); } });
  try {
    const failed = await broken.post(sample('Fictional DB Outage'));
    assert.equal(failed.status, 503);
    assert.equal(failed.data.ok, false);
    assert.equal(failed.data.requestId, undefined, 'Cannot acknowledge failed DB write');
    assert.equal(failed.data.code, 'STORAGE_UNAVAILABLE');
  } finally {
    await broken.close();
  }

  // A distinct quote request must reuse the encrypted, transactional outbox path.
  const quotePayload={...sample('Fictional Quote'),intent:'quote',projectDetails:'Vraag over bestaande omvormer.'};
  const quoteLead=await store.receive({lead:quotePayload,requestKey:randomUUID()});
  const [quoteRows]=await pool.execute('SELECT id,request_type,encrypted_payload FROM aura_leads WHERE request_id=?',[quoteLead.requestId]);
  assert.equal(quoteRows[0]?.request_type,'quote');
  assert.equal(openLead(quoteRows[0].encrypted_payload,quoteRows[0].id,key).projectDetails,'Vraag over bestaande omvormer.');
  assert.ok(!quoteRows[0].encrypted_payload.includes(Buffer.from('Vraag over bestaande omvormer.')));
  const quoteMails=[];
  const quoteWorker=createNotificationWorker({store,config,transport:{async sendMail(mail){quoteMails.push(mail);return {accepted:[mail.to]};}}});
  await quoteWorker.flush(8);
  const matchingQuoteMails=quoteMails.filter(mail=>mail.messageId === '<'+quoteLead.requestId+'@hyxi-aura.nl>');
  assert.equal(matchingQuoteMails.length,1,'The quote has one matching notification even if other test leads are pending');
  assert.equal(matchingQuoteMails[0].subject,'Fictional Quote | Leiden');
  assert.match(matchingQuoteMails[0].text,/Vraag over bestaande omvormer/);
  assert.equal((await status(quoteLead.requestId)).delivery_status,'accepted');

  console.log('PASS MySQL migration + AES-GCM + transaction rollback + durable idempotency + outbox failure/retry + API');
} finally {
  await pool.end();
}
