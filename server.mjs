import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { loadConfig } from './server/config.mjs';
import { createApp } from './server/app.mjs';
import { createTransport } from './server/mail.mjs';

export { createApp } from './server/app.mjs';
export { loadConfig } from './server/config.mjs';

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  const distDir = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');
  if (!existsSync(resolve(distDir, 'index.html'))) {
    console.error('Production files are missing. Run npm run build before npm start.');
    process.exitCode = 1;
  } else {
    const transport = createTransport(config);
    const app = createApp({ config, transport, distDir });
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`HYXI AURA listening on port ${config.port}. Lead intake ${config.leadEnabled ? 'enabled' : 'disabled'}.`);
    });
    server.requestTimeout = 30000;
    server.headersTimeout = 15000;
    for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
      server.close(() => { transport?.close?.(); process.exit(0); });
      setTimeout(() => process.exit(1), 30000).unref();
    });
  }
}
