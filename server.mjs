import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { loadConfig } from './server/config.mjs';
import { createApp } from './server/app.mjs';
import { createTransport } from './server/mail.mjs';
import { createLeadPool, assertLeadSchema } from './server/db/pool.mjs';
import { createMysqlLeadStore, assertNotificationBudgetSchema } from './server/db/store.mjs';
import { createNotificationWorker } from './server/db/worker.mjs';
import { createAdminStore, assertAdminSchema } from './server/auth/store.mjs';
import { assertAccountManagementSchema } from './server/auth/accounts.mjs';

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
    let leadStore = null, notificationWorker = null, leadPool = null;
    if (config.storageMode === 'database') {
      if (config.dbConfigured && config.dbSecretsConfigured) {
        try {
          leadPool = createLeadPool(config);
          await assertLeadSchema(leadPool);
          leadStore = createMysqlLeadStore({
            pool: leadPool,
            encryptionKey: config.encryptionKey,
            hashSecret: config.hashSecret,
          });
        } catch {
          // A database failure disables the form but NOT the public homepage.
          // Never revert to SMTP-only: that would silently lose audit/DB records.
          console.error('HYXI AURA database is not ready. Lead intake is disabled until resolved.');
          if (leadPool) await leadPool.end().catch(() => {});
          leadPool = null;
        }
      } else {
        console.warn('HYXI AURA database storage selected but configuration is incomplete. Intake disabled.');
      }
    }
    // Closing the public intake or losing SMTP configuration must never lock
    // the owner out of existing records and the incident workbench.
    if (leadStore && transport) {
      try {
        await assertNotificationBudgetSchema(leadPool);
        notificationWorker = createNotificationWorker({ store: leadStore, transport, config });
      } catch {
        console.error('HYXI AURA notification schema is not ready; intake and mail dispatch remain disabled.');
      }
    }
    let adminStore = null;
    if (config.adminEnabled && leadPool) {
      try {
        await assertAdminSchema(leadPool);
        await assertAccountManagementSchema(leadPool);
        adminStore = createAdminStore({
          pool: leadPool,
          sessionSecret: config.adminSessionSecret,
          mfaKey: config.adminMfaKey,
          leadEncryptionKey: config.encryptionKey,
        });
      } catch {
        // The public site remains available even if the protected dashboard
        // is unconfigured or the admin schema is not ready. Never log secrets.
        console.error('HYXI AURA Beheer is not ready; protected routes remain closed.');
      }
    }
    const app = createApp({
      config, transport,
      leadStore: notificationWorker ? leadStore : null,
      notificationWorker, adminStore, distDir,
    });
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`HYXI AURA listening on port ${config.port}. Lead intake ${config.leadEnabled && (config.storageMode !== 'database' || Boolean(notificationWorker)) ? 'enabled' : 'disabled'}.`);
      notificationWorker?.start();
    });
    server.on('error', error => {
      // Avoid dumping the environment or SMTP configuration into logs.
      console.error('HYXI AURA failed to bind HTTP listener:', error.code || error.name);
      process.exitCode = 1;
    });
    server.requestTimeout = 30000;
    server.headersTimeout = 15000;
    for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
      notificationWorker?.stop();
      server.close(async () => { transport?.close?.(); if (leadPool) await leadPool.end().catch(() => {}); process.exit(0); });
      setTimeout(() => process.exit(1), 30000).unref();
    });
  } catch (error) {
    // Missing or invalid configuration is visible in Hostinger runtime logs.
    // Do not log passwords or entire process.env.
    console.error('HYXI AURA startup failed:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 1;
  }
}
