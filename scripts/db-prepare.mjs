// Explicit setup on the database selected in the private environment.
// This script is never invoked by build, start, deployment or an HTTP request.
import { loadConfig } from '../server/config.mjs';
import { createLeadPool } from '../server/db/pool.mjs';
import { applyInitialMigration } from './db-migrate.mjs';
import { applyAdminMigration } from './db-admin-migrate.mjs';
import { applyAccountMigration } from './db-account-migrate.mjs';
import { applyNotificationMigration } from './db-notification-migrate.mjs';

if (process.argv.length !== 3 || process.argv[2] !== '--apply' || process.env.DB_SCHEMA_APPLY !== 'explicit-review-completed') {
  console.error('Database preparation refused. Review the target and backup first; use --apply and DB_SCHEMA_APPLY=explicit-review-completed.');
  process.exitCode = 1;
} else {
  let pool;
  try {
    const config = loadConfig();
    if (!config.dbConfigured) throw new Error('Complete database configuration required.');
    pool = createLeadPool(config);
    for (const apply of [applyInitialMigration, applyAdminMigration, applyAccountMigration, applyNotificationMigration]) {
      const result = await apply(pool);
      console.log(result.version + ': ' + (result.applied ? 'applied' : 'verified, already present'));
    }
    console.log('Schema preparation completed. Storage mode and admin access have not been changed.');
  } catch {
    console.error('Database preparation stopped. Review the target schema and migration ledger in the private hosting environment; no activation was attempted.');
    process.exitCode = 1;
  } finally { if (pool) await pool.end().catch(() => {}); }
}
