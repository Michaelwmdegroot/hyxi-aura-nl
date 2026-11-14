import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { loadConfig } from './server/config.mjs';
import { createApp } from './server/app.mjs';
import { createTransport } from './server/mail.mjs';

export { createApp } from './server/app.mjs';
export { loadConfig } from './server/config.mjs';

// This file is the production entry point, not a side-effect-free library.
// Hostinger and other Node.js process managers may import the entry module
// instead of passing its path as process.argv[1]. Start in both cases.
const distDir = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');

if (!existsSync(resolve(distDir, 'index.html'))) {
  console.error('HYXI AURA startup failed: dist/index.html is missing. Run npm run build.');
  process.exitCode = 1;
} else {
  try {
    const config = loadConfig();
    const transport = createTransport(config);
    const app = createApp({ config, transport, distDir });
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`HYXI AURA listening on port ${config.port}. Lead intake ${config.leadEnabled ? 'enabled' : 'disabled'}.`);
    });
    server.on('error', error => {
      // Avoid dumping the environment or SMTP configuration into logs.
      console.error('HYXI AURA failed to bind HTTP listener:', error.code || error.name);
      process.exitCode = 1;
    });
    server.requestTimeout = 30000;
    server.headersTimeout = 15000;
    for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
      server.close(() => { transport?.close?.(); process.exit(0); });
      setTimeout(() => process.exit(1), 30000).unref();
    });
  } catch (error) {
    // Missing or invalid configuration is visible in Hostinger runtime logs.
    // Do not log passwords or entire process.env.
    console.error('HYXI AURA startup failed:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 1;
  }
}
