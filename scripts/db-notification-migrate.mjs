import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../server/config.mjs';
import { createLeadPool, assertLeadSchema } from '../server/db/pool.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = '004_notification_budget';
const table = 'aura_notification_daily_budget';

async function verifyBudgetTable(conn) {
  const [tables] = await conn.execute(
    'SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?', [table],
  );
  const [columns] = await conn.execute(
    'SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION', [table],
  );
  if (tables[0]?.ENGINE !== 'InnoDB' || columns.length !== 2 ||
      columns[0].COLUMN_NAME !== 'day_key' || columns[0].COLUMN_TYPE !== 'date' ||
      columns[0].IS_NULLABLE !== 'NO' || columns[0].COLUMN_KEY !== 'PRI' ||
      columns[1].COLUMN_NAME !== 'attempt_count' || !/^int(?:\(\d+\))? unsigned$/.test(columns[1].COLUMN_TYPE) ||
      columns[1].IS_NULLABLE !== 'NO' || columns[1].COLUMN_KEY !== '') {
    throw new Error('Existing notification budget table differs from the reviewed schema.');
  }
}

export async function applyNotificationMigration(pool) {
  await assertLeadSchema(pool);
  const source = await readFile(resolve(root, 'db/migrations/004_notification_budget.sql'), 'utf8');
  const checksum = createHash('sha256').update(source).digest('hex');
  const sql = source.split('\n').filter(line => !/^\s*--/.test(line)).join('\n').trim();
  const statements = sql.split(';').map(value => value.trim()).filter(Boolean);
  if (statements.length !== 1 || !statements[0].startsWith('CREATE TABLE IF NOT EXISTS ' + table + ' (')) {
    throw new Error('Unexpected notification migration structure.');
  }
  const conn = await pool.getConnection();
  let locked = false;
  try {
    const [locks] = await conn.query("SELECT GET_LOCK(CONCAT('aura_notify:',LEFT(SHA2(DATABASE(),256),40)),10) AS acquired");
    if (Number(locks[0]?.acquired) !== 1) throw new Error('Notification migration is locked.');
    locked = true;
    const [existing] = await conn.execute('SELECT checksum FROM aura_schema_migrations WHERE version=? LIMIT 1', [version]);
    if (existing.length) {
      if (existing[0].checksum !== checksum) throw new Error('Notification migration checksum differs.');
      await verifyBudgetTable(conn);
      return { version, applied: false };
    }
    await conn.query(statements[0]);
    await verifyBudgetTable(conn);
    await conn.execute('INSERT INTO aura_schema_migrations (version,checksum,applied_at) VALUES (?,?,UTC_TIMESTAMP(3))', [version,checksum]);
    return { version, applied: true };
  } finally {
    if (locked) await conn.query("SELECT RELEASE_LOCK(CONCAT('aura_notify:',LEFT(SHA2(DATABASE(),256),40)))").catch(() => {});
    conn.release();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--apply') || process.env.DB_SCHEMA_APPLY !== 'explicit-review-completed') {
    console.error('Notification migration refused; --apply and explicit DB_SCHEMA_APPLY are required.');
    process.exitCode = 1;
  } else {
    let pool;
    try {
      const config = loadConfig();
      if (!config.dbConfigured) throw new Error('Complete DB configuration required.');
      pool = createLeadPool(config);
      const result = await applyNotificationMigration(pool);
      console.log('HYXI notification schema 004: ' + (result.applied ? 'applied' : 'already present'));
    } catch {
      console.error('HYXI notification migration failed; inspect the target schema securely.');
      process.exitCode = 1;
    } finally { if (pool) await pool.end().catch(() => {}); }
  }
}
