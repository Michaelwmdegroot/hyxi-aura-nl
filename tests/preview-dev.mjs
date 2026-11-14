/** A local, test-only full-stack preview. All email delivery is simulated. */
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

if (process.env.NODE_ENV === 'production') throw new Error('QA preview cannot run in production.');
const portArgument = process.argv.indexOf('--port');
const port = portArgument >= 0 ? Number(process.argv[portArgument + 1]) : 4173;
const api = spawn(process.execPath, ['tests/preview-api.mjs'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: '3001', NODE_ENV: 'test' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((resolve, reject) => {
  api.stdout.once('data', chunk => { process.stdout.write(chunk); resolve(); });
  api.once('error', reject);
  api.once('exit', code => reject(new Error(`QA API exited with ${code}`)));
});
api.stdout.pipe(process.stdout);
const vite = await createServer({
  server: { host: '127.0.0.1', port, strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:3001', '/__qa': 'http://127.0.0.1:3001' } },
});
await vite.listen();
vite.printUrls();
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await vite.close();
  api.kill('SIGTERM');
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => close().then(() => process.exit(0)));
api.once('exit', code => { if (!closing) close().then(() => process.exit(code || 1)); });
