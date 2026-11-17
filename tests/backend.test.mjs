import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { createApp } from '../server/app.mjs';
import { loadConfig } from '../server/config.mjs';

const sample = () => ({
  fullName: 'Test Bewoner', email: 'bewoner@example.test', phone: '0612345678', postcode: '1234 AB', consent: true,
  profile: { solar: 'yes', annualUsage: 4200, goal: 'solar', phase: 'three', moduleType: 9, moduleCount: 2 },
  attribution: { utm_source: 'test', utm_medium: 'qa', utm_campaign: 'aura' }, website: '',
});
const settings = extra => loadConfig({
  NODE_ENV: 'test', SITE_URL: 'https://hyxi-aura.nl', LEAD_ENABLED: 'true', SMTP_HOST: 'smtp.example.test',
  SMTP_USER: 'sender@example.test', SMTP_PASS: 'test-only-not-a-real-secret', SMTP_FROM: 'sender@example.test',
  LEAD_TO: 'leads@example.test', CSRF_SECRET: 'a-test-secret-with-at-least-thirty-two-characters', ...extra,
});

async function fixture(t, { env, sendMail, now, sendTimeoutMs } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'aura-server-test-'));
  const dist = join(root, 'dist');
  await mkdir(dist);
  await writeFile(join(dist, 'index.html'), '<!doctype html><title>AURA test</title><script type="application/ld+json">{"@type":"Product"}</script><h1>HYXI AURA</h1>');
  await writeFile(join(dist, 'privacy.html'), '<h1>Privacy</h1>');
  await writeFile(join(dist, 'public-copy.txt'), 'HYXI AURA — energie bewaren voor later.\n'.repeat(100));
  await writeFile(join(root, '.env'), 'NEVER_PUBLIC');
  await writeFile(join(root, 'server.mjs'), 'NEVER_PUBLIC');
  const calls = [];
  const config = settings(env);
  const transport = { async sendMail(mail) {
    calls.push(mail);
    return sendMail ? sendMail(mail, calls.length) : { accepted: [config.smtp.to], rejected: [] };
  } };
  const app = createApp({ config, transport, distDir: dist, ...(now ? { now } : {}), ...(sendTimeoutMs ? { sendTimeoutMs } : {}) });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const configResponse = await fetch(`${base}/api/config`);
  const data = await configResponse.json();
  const cookie = configResponse.headers.get('set-cookie').split(';')[0];
  const post = (body = sample(), { key = randomUUID(), headers = {}, raw = false } = {}) => fetch(`${base}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: config.siteUrl, Cookie: cookie, 'X-CSRF-Token': data.csrfToken, 'Idempotency-Key': key, ...headers },
    body: raw ? body : JSON.stringify(body),
  });
  return { base, config, data, cookie, post, calls };
}

test('valid lead is confirmed only after the configured recipient accepts it', async t => {
  const f = await fixture(t);
  const response = await f.post();
  assert.equal(response.status, 201);
  const receipt = await response.json();
  assert.equal(receipt.ok, true);
  assert.match(receipt.requestId, /^AURA-[0-9a-f-]{36}$/);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].to, 'leads@example.test');
  assert.equal(f.calls[0].replyTo.address, 'bewoner@example.test');
  assert.match(f.calls[0].text, /Bron: https:\/\/hyxi-aura.nl/);
  assert.match(f.calls[0].text, /Postcode: 1234AB/);
  assert.match(f.calls[0].text, /17\.2 kWh/);
  assert.doesNotMatch(JSON.stringify(receipt), /bewoner|1234AB|0612345678/);
});

test('same-key concurrent retries and recent duplicate bodies send a single message', async t => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, { sendMail: async () => { await held; return { accepted: ['leads@example.test'] }; } });
  const key = randomUUID();
  const first = f.post(sample(), { key });
  const second = f.post(sample(), { key });
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.deepEqual(await a.json(), await b.json());
  assert.equal(f.calls.length, 1);
  assert.equal((await f.post()).status, 200);
  assert.equal(f.calls.length, 1);
  const changed = sample(); changed.fullName = 'Andere Naam';
  assert.equal((await f.post(changed, { key })).status, 409);
});

test('disabled or incomplete mail configuration never reports acceptance', async t => {
  for (const env of [{ LEAD_ENABLED: 'false' }, { SMTP_PASS: '' }, { SMTP_FROM: '' }]) {
    const f = await fixture(t, { env });
    assert.equal(f.data.leadEnabled, false);
    const response = await f.post();
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
    assert.equal(f.calls.length, 0);
  }
});

test('SMTP failure or acceptance of a different address does not create a receipt', async t => {
  for (const sendMail of [async () => { throw new Error('secret SMTP password must never be returned'); }, async () => ({ accepted: ['wrong@example.test'] })]) {
    const f = await fixture(t, { sendMail });
    const response = await f.post();
    assert.equal(response.status, 502);
    const data = await response.json();
    assert.equal(data.ok, false);
    assert.equal(data.requestId, undefined);
    assert.doesNotMatch(JSON.stringify(data), /password|secret/);
  }
});

test('failed delivery can retry with the same key and stable request identifier', async t => {
  const f = await fixture(t, { sendMail: async (_mail, attempt) => {
    if (attempt === 1) throw Object.assign(new Error('transient connection failure before delivery'), { code: 'ECONNREFUSED' });
    return { accepted: ['leads@example.test'] };
  } });
  const key = randomUUID();
  assert.equal((await f.post(sample(), { key })).status, 502);
  assert.equal((await f.post(sample(), { key })).status, 201);
  assert.equal(f.calls[0].messageId, f.calls[1].messageId);
});

test('origin, signed CSRF token, cookie, and token expiry are all enforced', async t => {
  let time = Date.now();
  const f = await fixture(t, { now: () => time });
  for (const headers of [{ Origin: 'https://attacker.example' }, { Origin: '' }, { 'X-CSRF-Token': 'wrong' }, { Cookie: '' }]) {
    assert.equal((await f.post(sample(), { headers })).status, 403);
  }
  time += 2 * 60 * 60 * 1000 + 1;
  assert.equal((await f.post()).status, 403);
  assert.equal(f.calls.length, 0);
});

test('field validation blocks invalid consent, header injection, unsafe ranges, and forged source', async t => {
  const f = await fixture(t, { env: { LEAD_RATE_LIMIT: '60' } });
  const bad = [
    { consent: false }, { email: 'bad\r\nBcc:foo@example.test' }, { fullName: 'Jan\r\nBcc: foo@example.test' },
    { phone: 'letters only' }, { postcode: '0000 XX' }, { source: 'another-site.example' },
    { profile: { ...sample().profile, moduleCount: 7 } }, { profile: { ...sample().profile, annualUsage: -1 } },
    { profile: { ...sample().profile, moduleType: '9' } }, { attribution: { utm_source: 'x'.repeat(121) } },
  ];
  for (const patch of bad) {
    const response = await f.post({ ...sample(), ...patch });
    assert.equal(response.status, 422, JSON.stringify(patch));
  }
  assert.equal((await f.post({ ...sample(), website: 'https://spam.example' })).status, 400);
  assert.equal(f.calls.length, 0);
});

test('request method, malformed JSON, body size, and media type are bounded', async t => {
  const f = await fixture(t);
  assert.equal((await fetch(`${f.base}/api/leads`)).status, 405);
  assert.equal((await f.post('{invalid', { raw: true })).status, 400);
  assert.equal((await f.post(JSON.stringify({ ...sample(), big: 'x'.repeat(14000) }), { raw: true })).status, 413);
  assert.equal((await f.post('data', { raw: true, headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal(f.calls.length, 0);
});

test('rate limiting ignores untrusted X-Forwarded-For', async t => {
  const f = await fixture(t, { env: { LEAD_RATE_LIMIT: '2' } });
  for (let i = 0; i < 2; i++) {
    assert.equal((await f.post({ ...sample(), fullName: `Bewoner ${i}` }, { headers: { 'X-Forwarded-For': `198.51.100.${i}` } })).status, 201);
  }
  const limited = await f.post({ ...sample(), fullName: 'Bewoner drie' }, { headers: { 'X-Forwarded-For': '198.51.100.99' } });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  assert.equal(f.calls.length, 2);
});

test('daily delivery budget caps sends even with distinct valid requests', async t => {
  const f = await fixture(t, { env: { SMTP_DAILY_LIMIT: '1' } });
  assert.equal((await f.post()).status, 201);
  const response = await f.post({ ...sample(), fullName: 'Tweede Bewoner' });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'DAILY_LIMIT');
  assert.equal(f.calls.length, 1);
});

test('serves only dist, uses real 404s, and applies security/cache headers', async t => {
  const f = await fixture(t);
  const index = await fetch(f.base);
  assert.equal(index.status, 200);
  const csp = index.headers.get('content-security-policy');
  assert.match(csp, /script-src 'self' 'sha256-/);
  assert.doesNotMatch(csp.split(';').find(v => v.includes('script-src')), /unsafe-inline|unsafe-eval/);
  assert.equal(index.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(index.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal((await fetch(`${f.base}/privacy`)).status, 200);
  for (const encoding of ['gzip', 'br']) {
    const compressed = await fetch(`${f.base}/public-copy.txt`, { headers: { 'Accept-Encoding': encoding } });
    assert.equal(compressed.headers.get('content-encoding'), encoding);
    assert.match(compressed.headers.get('vary'), /Accept-Encoding/);
    assert.equal(await compressed.text(), 'HYXI AURA — energie bewaren voor later.\n'.repeat(100));
  }
  for (const path of ['/.env', '/server.mjs', '/server/config.mjs', '/package.json', '/missing', '/api/missing']) {
    const response = await fetch(`${f.base}${path}`);
    assert.equal(response.status, 404, path);
    assert.doesNotMatch(await response.text(), /NEVER_PUBLIC/);
  }
  const config = await fetch(`${f.base}/api/config`, { headers: { 'Accept-Encoding': 'gzip, br' } });
  assert.equal(config.headers.get('content-encoding'), null);
  assert.equal(config.headers.get('cache-control'), 'no-store');
  assert.match(config.headers.get('set-cookie'), /HttpOnly/);
  assert.match(config.headers.get('set-cookie'), /SameSite=Strict/);
  const health = await (await fetch(`${f.base}/api/health`)).json();
  assert.deepEqual(health, { ok: true, service: 'hyxi-aura', leadEnabled: true });
});

test('production rejects localhost origins unless explicitly allowed', async t => {
  const f = await fixture(t, { env: { NODE_ENV: 'production' } });
  const response = await fetch(`${f.base}/api/config`);
  assert.match(response.headers.get('set-cookie'), /Secure/);
  assert.equal((await f.post(sample(), { headers: { Origin: f.base } })).status, 403);
});

test('ambiguous SMTP acknowledgement loss never confirms or blindly resends', async t => {
  const f = await fixture(t, { sendMail: async () => { throw Object.assign(new Error('connection lost after DATA'), { code: 'ECONNECTION', command: 'CONN' }); } });
  const key = randomUUID();
  for (const requestKey of [key, key, randomUUID()]) {
    const response = await f.post(sample(), { key: requestKey });
    assert.equal(response.status, 502);
    const data = await response.json();
    assert.equal(data.code, 'DELIVERY_UNCERTAIN');
    assert.equal(data.ok, false);
    assert.equal(data.requestId, undefined);
  }
  assert.equal(f.calls.length, 1);
});

test('SMTP transaction abort bounds a stalled send and prevents a duplicate retry', async t => {
  let aborted = false;
  const f = await fixture(t, { sendTimeoutMs: 20, sendMail: mail => new Promise((_resolve, reject) => {
    mail.signal.addEventListener('abort', () => { aborted = true; reject(mail.signal.reason); }, { once: true });
  }) });
  const response = await f.post();
  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, 'DELIVERY_UNCERTAIN');
  assert.equal(aborted, true);
  assert.equal((await f.post()).status, 502);
  assert.equal(f.calls.length, 1);
});

test('a lost browser response does not cancel delivery or duplicate it on retry', async t => {
  let markStarted; let release;
  const started = new Promise(resolve => { markStarted = resolve; });
  const hold = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, { sendMail: async () => { markStarted(); await hold; return { accepted: ['leads@example.test'] }; } });
  const key = randomUUID();
  const request = http.request(`${f.base}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: f.config.siteUrl, Cookie: f.cookie, 'X-CSRF-Token': f.data.csrfToken, 'Idempotency-Key': key },
  });
  request.on('error', () => {});
  request.end(JSON.stringify(sample()));
  await started;
  request.destroy();
  release();
  const retry = await f.post(sample(), { key });
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).ok, true);
  assert.equal(f.calls.length, 1);
});

test('Vite localhost:5173 origin and reusable proxy cookie work in development', async t => {
  const f = await fixture(t, { env: { NODE_ENV: 'development' } });
  const refresh = await fetch(`${f.base}/api/config`, { headers: { Cookie: f.cookie } });
  assert.equal((await refresh.json()).csrfToken, f.data.csrfToken);
  assert.doesNotMatch(refresh.headers.get('set-cookie'), /; Secure/);
  assert.equal((await f.post(sample(), { headers: { Origin: 'http://localhost:5173' } })).status, 201);
});

test('canonical and preview hosts keep queries out of public API responses', async t => {
  const f = await fixture(t, { env: { NODE_ENV: 'production', CANONICAL_REDIRECT: 'true' } });
  const withHost = (path, host) => new Promise((resolve, reject) => {
    http.get(`${f.base}${path}`, { headers: { Host: host } }, response => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', value => { text += value; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, text }));
    }).on('error', reject);
  });
  const main = await withHost('/?utm_campaign=example', 'HYXI-AURA.NL');
  assert.equal(main.status, 200);
  assert.equal(main.headers['x-robots-tag'], undefined);
  const preview = await withHost('/?email=private@example.test', 'example.hostingersite.com');
  assert.equal(preview.headers['x-robots-tag'], 'noindex, nofollow');
  assert.doesNotMatch(preview.text, /private@example/);
  const canonical = await withHost('/privacy/?utm_source=check', 'www.hyxi-aura.nl');
  assert.equal(canonical.status, 308);
  assert.equal(canonical.headers.location, 'https://hyxi-aura.nl/privacy/?utm_source=check');

  // Duplicated static index.html paths must never compete with preferred
  // readable URLs in Google; the canonical hostname and query are preserved.
  for (const [alias, clean] of [
    ['/index.html', '/'],
    ['/modellen/index.html', '/modellen/'],
    ['/datasheet/index.html', '/datasheet/'],
    ['/kennis/garantie/index.html', '/kennis/garantie/'],
    ['/kennis/bestaande-zonnepanelen/index.html', '/kennis/bestaande-zonnepanelen/'],
    ['/privacy/index.html', '/privacy/']
  ]) {
    const result = await withHost(alias + '?utm_campaign=source-test', 'hyxi-aura.nl');
    assert.equal(result.status, 308, alias);
    assert.equal(result.headers.location, 'https://hyxi-aura.nl' + clean + '?utm_campaign=source-test');
  }
  const doubleAlias = await withHost('/datasheet/index.html?utm_source=search', 'www.hyxi-aura.nl');
  assert.equal(doubleAlias.status, 308);
  assert.equal(doubleAlias.headers.location, 'https://hyxi-aura.nl/datasheet/?utm_source=search');
  const typo = await withHost('/niet-bestaand/index.html', 'hyxi-aura.nl');
  assert.equal(typo.status, 404, 'Never redirect an unknown document into a soft 404');
  assert.match(typo.text, /noindex/);
  const previewAlias = await withHost('/modellen/index.html', 'example.hostingersite.com');
  assert.equal(previewAlias.status, 200);
  assert.equal(previewAlias.headers['x-robots-tag'], 'noindex, nofollow');

  const config = await fetch(`${f.base}/api/config?email=private@example.test`);
  assert.doesNotMatch(await config.text(), /private@example/);
});

test('concurrent delivery work is capped without cancelling accepted work', async t => {
  let markStarted; let release;
  const started = new Promise(resolve => { markStarted = resolve; });
  const hold = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, { env: { LEAD_RATE_LIMIT: '60' }, sendMail: async (_mail, attempt) => {
    if (attempt === 5) markStarted();
    await hold;
    return { accepted: ['leads@example.test'] };
  } });
  const running = Array.from({ length: 5 }, (_, i) => f.post({ ...sample(), fullName: `Bewoner ${i}` }));
  await started;
  try {
    const busy = await f.post({ ...sample(), fullName: 'Zesde bewoner' });
    assert.equal(busy.status, 503);
    assert.equal((await busy.json()).code, 'BUSY');
    assert.equal(f.calls.length, 5);
  } finally { release(); }
  for (const response of await Promise.all(running)) assert.equal(response.status, 201);
  assert.equal((await f.post({ ...sample(), fullName: 'Zesde bewoner' })).status, 201);
  assert.equal(f.calls.length, 6);
});
