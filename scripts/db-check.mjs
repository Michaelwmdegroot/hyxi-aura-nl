import { loadConfig } from '../server/config.mjs';
import { createLeadPool, assertLeadSchema } from '../server/db/pool.mjs';
import { assertAccountManagementSchema } from '../server/auth/accounts.mjs';
import { assertNotificationBudgetSchema } from '../server/db/store.mjs';

let pool;
try {
  const config = loadConfig();
  if (!config.dbConfigured) throw new Error('Database environment is incomplete.');
  pool = createLeadPool(config);
  const [rows] = await pool.query('SELECT VERSION() AS version, UTC_TIMESTAMP() AS server_time');
  console.log('HYXI AURA database connection: ready. Server version: ' + rows[0].version);
  if (!process.argv.includes('--connection')) {
    await assertLeadSchema(pool);
    await assertAccountManagementSchema(pool);
    await assertNotificationBudgetSchema(pool);
    const [owners] = await pool.query("SELECT COUNT(*) AS total FROM aura_admin_users WHERE role='admin' AND disabled_at IS NULL");
    console.log('Lead, admin, account-recovery and notification-budget schemas verified.');
    console.log('Active owner accounts: ' + Number(owners[0].total));
  }
} catch {
  console.error('HYXI AURA database check failed. Check the private DB settings and schema migrations 001–004. Use --connection to check connectivity before applying the schema.');
  process.exitCode = 1;
} finally {
  if (pool) await pool.end().catch(() => {});
}
