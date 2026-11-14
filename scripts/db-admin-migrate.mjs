import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../server/config.mjs';
import { createLeadPool, assertLeadSchema } from '../server/db/pool.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const filename = resolve(root, 'db/migrations/002_admin_auth.sql');
const version = '002_admin_auth';
const expected = ['aura_admin_users', 'aura_admin_sessions', 'aura_admin_login_guards', 'aura_admin_audit'];

export async function applyAdminMigration(pool) {
  await assertLeadSchema(pool);
  const source = await readFile(filename, 'utf8');
  const checksum = createHash('sha256').update(source).digest('hex');
  // Only fixed CREATE TABLE statements. We intentionally refuse more complex
  // SQL without a separate parser/review.
  const stripped = source.split('\n').filter(line => !/^\s*--/.test(line)).join('\n');
  const statements = stripped.split(';').map(s => s.trim()).filter(Boolean);
  if (statements.length !== expected.length || statements.some((s,i) => !s.startsWith('CREATE TABLE IF NOT EXISTS ' + expected[i] + ' ('))) {
    throw new Error('Unexpected admin migration structure. Manual schema review required.');
  }
  const [existing] = await pool.execute('SELECT checksum FROM aura_schema_migrations WHERE version = ? LIMIT 1', [version]);
  if (existing.length) {
    if (existing[0].checksum !== checksum) throw new Error('Admin migration checksum does not match the applied version.');
    return { version, applied: false };
  }
  for (const statement of statements) await pool.query(statement);
  await pool.execute(
    'INSERT INTO aura_schema_migrations (version, checksum, applied_at) VALUES (?, ?, UTC_TIMESTAMP(3))',
    [version, checksum],
  );
  return { version, applied: true };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--apply') || process.env.DB_SCHEMA_APPLY !== 'explicit-review-completed') {
    console.error('Admin schema migration refused; --apply and explicit DB_SCHEMA_APPLY are mandatory.');
    process.exitCode = 1;
  } else {
    let pool;
    try {
      const config = loadConfig();
      if (!config.dbConfigured) throw new Error('DB not configured.');
      pool = createLeadPool(config);
      const result = await applyAdminMigration(pool);
      console.log('HYXI admin schema 002: ' + (result.applied ? 'applied' : 'already present'));
    } catch {
      console.error('HYXI admin schema migration failed; inspect target schema via secure management tools.');
      process.exitCode = 1;
    } finally {
      if (pool) await pool.end();
    }
  }
}
