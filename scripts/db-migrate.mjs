import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../server/config.mjs';
import { createLeadPool } from '../server/db/pool.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationFile = resolve(root, 'db/migrations/001_initial_leads.sql');
const version = '001_initial_leads';

export async function applyInitialMigration(pool) {
  const source = await readFile(migrationFile, 'utf8');
  const checksum = createHash('sha256').update(source).digest('hex');
  // This intentionally small, reviewed migration has no semicolons inside
  // strings or stored procedures. We reject any later change that requires
  // more complex SQL parsing instead of allowing multiStatements.
  const sql = source.split('\n').filter(line => !/^\s*--/.test(line)).join('\n');
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  if (statements.length !== 5 || statements.some(s => !s.startsWith('CREATE TABLE IF NOT EXISTS aura_'))) {
    throw new Error('Unexpected migration structure: manual review required.');
  }
  await pool.query(statements[0]);
  const [recorded] = await pool.execute(
    'SELECT checksum FROM aura_schema_migrations WHERE version = ? LIMIT 1',
    [version],
  );
  if (recorded.length) {
    if (recorded[0].checksum !== checksum) throw new Error('Existing migration checksum differs: aborting.');
    return { applied: false, version };
  }
  for (const statement of statements.slice(1)) await pool.query(statement);
  await pool.execute(
    'INSERT INTO aura_schema_migrations (version, checksum, applied_at) VALUES (?, ?, UTC_TIMESTAMP(3))',
    [version, checksum],
  );
  return { applied: true, version };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--apply') || process.env.DB_SCHEMA_APPLY !== 'explicit-review-completed') {
    console.error('Migration refused. Explicit --apply and DB_SCHEMA_APPLY=explicit-review-completed are required.');
    process.exitCode = 1;
  } else {
    let pool;
    try {
      const config = loadConfig();
      if (!config.dbConfigured) throw new Error('No complete database configuration.');
      pool = createLeadPool(config);
      const result = await applyInitialMigration(pool);
      console.log('HYXI AURA database migration 001: ' + (result.applied ? 'applied' : 'already applied'));
    } catch {
      // The underlying MySQL error can contain private configuration.
      console.error('HYXI AURA migration failed. Examine the target schema and migration ledger securely.');
      process.exitCode = 1;
    } finally {
      if (pool) await pool.end();
    }
  }
}
