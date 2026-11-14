import { loadConfig } from '../server/config.mjs';
import { createLeadPool, assertLeadSchema } from '../server/db/pool.mjs';

let pool;
try {
  const config = loadConfig();
  if (!config.dbConfigured) throw new Error('Database environment is incomplete.');
  pool = createLeadPool(config);
  await assertLeadSchema(pool);
  console.log('HYXI AURA MySQL connection and migration 001 are ready.');
} catch {
  console.error('HYXI AURA MySQL readiness check failed. Check DB credentials and applied migration 001 in Hostinger.');
  process.exitCode = 1;
} finally {
  if (pool) await pool.end().catch(() => {});
}
