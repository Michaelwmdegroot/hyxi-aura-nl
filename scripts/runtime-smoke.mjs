/**
 * Production-entry smoke check for hosts that execute server.mjs directly or
 * import the entry module through a Node.js process manager.
 * Uses only Node built-ins, never connects to SMTP, and never sends leads.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function availablePort() {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}

async function request(origin, path) {
  const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(1500) });
  if (response.status !== 200) throw new Error(`${path} returned HTTP ${response.status}`);
  return response;
}

async function smoke(label, args) {
  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    SITE_URL: 'https://hyxi-aura.nl',
    ALLOWED_ORIGINS: '',
    CANONICAL_REDIRECT: 'true',
    TRUST_PROXY: 'false',
    LEAD_ENABLED: 'false',
    SMTP_HOST: '',
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM: '',
    LEAD_TO: 'leads@thuisbatterijteam.nl',
  };
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '', exited = false;
  child.stdout.on('data', chunk => { stdout = (stdout + chunk.toString()).slice(-8000); });
  child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-8000); });
  const exit = once(child, 'exit').then(() => { exited = true; }).catch(() => { exited = true; });
  try {
    let healthy = false;
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      if (exited) break;
      try {
        const response = await request(origin, '/api/health');
        const data = await response.json();
        if (data.ok !== true || data.service !== 'hyxi-aura' || data.leadEnabled !== false) {
          throw new Error('Unexpected health response');
        }
        healthy = true;
        break;
      } catch {
        await sleep(100);
      }
    }
    if (!healthy) throw new Error(`HTTP listener did not become healthy on port ${port}`);
    for (const path of ['/', '/privacy/', '/bronnen/']) {
      const response = await request(origin, path);
      if (!(await response.text()).includes('HYXI')) throw new Error(`Missing product content at ${path}`);
    }
    const config = await (await request(origin, '/api/config')).json();
    if (config.leadEnabled !== false || !config.csrfToken) throw new Error('Session/config response invalid');
    const inaccessible = await fetch(`${origin}/.env`);
    if (inaccessible.status !== 404) throw new Error('Environment file must never be public');
    console.log(`PASS ${label}: listener, three pages, health, CSRF config and file boundaries`);
  } catch (error) {
    throw new Error(`${label}: ${error.message}\nstdout:\n${stdout}\nstderr:\n${stderr}`);
  } finally {
    if (!exited) child.kill('SIGTERM');
    await Promise.race([exit, sleep(2000)]);
    if (!exited) {
      child.kill('SIGKILL');
      await exit;
    }
  }
}

await smoke('direct node server.mjs', ['server.mjs']);
await smoke('hosting loader import(server.mjs)', ['--input-type=module', '-e', "import('./server.mjs')"]);
