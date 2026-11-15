import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../server/config.mjs';
import { createLeadPool } from '../server/db/pool.mjs';
import { assertAdminSchema } from '../server/auth/store.mjs';

const migrationFile = new URL('../db/migrations/003_account_audit.sql', import.meta.url);
const version = '003_account_audit';
const lockName = 'aura_beheer_schema_account_audit';
const expected = [
  'ALTER TABLE aura_admin_audit ADD COLUMN target_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER actor_user_id',
  'ALTER TABLE aura_admin_audit ADD KEY idx_aura_admin_audit_target_time (target_user_id, occurred_at)',
];

async function columnState(conn) {
  const [rows] = await conn.execute(
    "SELECT DATA_TYPE,COLUMN_TYPE,IS_NULLABLE,COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='aura_admin_audit' AND COLUMN_NAME='target_user_id'",
  );
  if (!rows.length) return false;
  const col = rows[0];
  if (rows.length !== 1 || col.DATA_TYPE !== 'char' || col.COLUMN_TYPE !== 'char(36)' ||
      col.IS_NULLABLE !== 'YES' || col.COLLATION_NAME !== 'ascii_bin') {
    throw new Error('Account audit column differs from the reviewed schema.');
  }
  return true;
}

async function indexState(conn) {
  const [rows] = await conn.execute(
    "SELECT COLUMN_NAME,SEQ_IN_INDEX,NON_UNIQUE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='aura_admin_audit' AND INDEX_NAME='idx_aura_admin_audit_target_time' ORDER BY SEQ_IN_INDEX",
  );
  if (!rows.length) return false;
  if (rows.length !== 2 || rows[0].COLUMN_NAME !== 'target_user_id' ||
      rows[1].COLUMN_NAME !== 'occurred_at' || rows.some(row => Number(row.NON_UNIQUE) !== 1)) {
    throw new Error('Account audit index differs from the reviewed schema.');
  }
  return true;
}

export async function applyAccountMigration(pool) {
  await assertAdminSchema(pool);
  const source = await readFile(migrationFile, 'utf8');
  const checksum = createHash('sha256').update(source).digest('hex');
  const statements = source.split('\n').filter(line => !/^\s*--/.test(line)).join('\n')
    .split(';').map(value => value.trim()).filter(Boolean);
  if (statements.length !== expected.length || statements.some((sql, index) => sql.replace(/\s+/g, ' ') !== expected[index])) {
    throw new Error('Unexpected account audit migration; manual review required.');
  }
  const conn = await pool.getConnection();
  let locked = false;
  try {
    const [locks] = await conn.execute('SELECT GET_LOCK(?,10) AS acquired', [lockName]);
    if (Number(locks[0]?.acquired) !== 1) throw new Error('Account audit migration is locked.');
    locked = true;
    const [recorded] = await conn.execute('SELECT checksum FROM aura_schema_migrations WHERE version=? LIMIT 1', [version]);
    if (recorded.length && recorded[0].checksum !== checksum) throw new Error('Account audit migration checksum differs.');
    let column = await columnState(conn);
    let index = await indexState(conn);
    if (recorded.length) {
      if (!column || !index) throw new Error('Recorded account audit migration is incomplete.');
      return { version, applied: false };
    }
    // MySQL DDL commits independently. On retry inspect each exact object;
    // never mask an unexpected schema with IF NOT EXISTS.
    if (!column) { await conn.query(statements[0]); column = await columnState(conn); }
    if (!index) { await conn.query(statements[1]); index = await indexState(conn); }
    if (!column || !index) throw new Error('Account audit migration did not complete.');
    await conn.execute(
      'INSERT INTO aura_schema_migrations (version,checksum,applied_at) VALUES (?,?,UTC_TIMESTAMP(3))',
      [version, checksum],
    );
    return { version, applied: true };
  } finally {
    if (locked) await conn.execute('SELECT RELEASE_LOCK(?)', [lockName]).catch(() => {});
    conn.release();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || process.argv[2] !== '--apply' || process.env.DB_SCHEMA_APPLY !== 'explicit-review-completed') {
    console.error('Account audit migration refused. Use --apply and DB_SCHEMA_APPLY=explicit-review-completed.');
    process.exitCode = 1;
  } else {
    let pool;
    try {
      const config = loadConfig();
      if (!config.dbConfigured) throw new Error('DB not configured.');
      pool = createLeadPool(config);
      const result = await applyAccountMigration(pool);
      console.log('HYXI account audit schema 003: ' + (result.applied ? 'applied' : 'already present'));
    } catch {
      console.error('Account audit migration failed. Inspect the schema and migration ledger in the trusted management environment.');
      process.exitCode = 1;
    } finally {
      if (pool) await pool.end().catch(() => {});
    }
  }
}
