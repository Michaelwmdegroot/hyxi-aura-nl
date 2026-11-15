/** Corrupt and restore schema objects only in the disposable local CI DB. */
import assert from 'node:assert/strict';
import { loadConfig } from '../server/config.mjs';
import { createLeadPool, assertLeadSchema } from '../server/db/pool.mjs';
import { assertAdminSchema } from '../server/auth/store.mjs';
import { applyInitialMigration } from '../scripts/db-migrate.mjs';
import { applyAdminMigration } from '../scripts/db-admin-migrate.mjs';

if (process.env.NODE_ENV !== 'test' || !/(?:test|ci)/i.test(process.env.DB_NAME || '') ||
    !['127.0.0.1','localhost','::1'].includes(process.env.DB_HOST || '127.0.0.1')) {
  throw new Error('Schema drift tests require a disposable local test/CI database.');
}
const pool=createLeadPool(loadConfig(process.env));
async function altered(change,restore,check) {
  await pool.query(change);
  try{await check();}finally{await pool.query(restore);}
}
try {
  await applyInitialMigration(pool);
  await applyAdminMigration(pool);
  await assertLeadSchema(pool);
  await assertAdminSchema(pool);

  await altered(
    'ALTER TABLE aura_admin_login_guards ENGINE=MyISAM',
    'ALTER TABLE aura_admin_login_guards ENGINE=InnoDB',
    async()=>{
      await assert.rejects(()=>assertAdminSchema(pool),/transactional table/);
      await assert.rejects(()=>applyAdminMigration(pool),/transactional table/);
    },
  );
  await altered(
    'ALTER TABLE aura_admin_users DROP INDEX uq_aura_admin_email',
    'ALTER TABLE aura_admin_users ADD UNIQUE KEY uq_aura_admin_email (login_email)',
    async()=>await assert.rejects(()=>assertAdminSchema(pool),/unique key/),
  );
  await altered(
    'ALTER TABLE aura_admin_sessions DROP FOREIGN KEY fk_aura_admin_session_user',
    'ALTER TABLE aura_admin_sessions ADD CONSTRAINT fk_aura_admin_session_user FOREIGN KEY (user_id) REFERENCES aura_admin_users(id) ON DELETE CASCADE',
    async()=>await assert.rejects(()=>assertAdminSchema(pool),/foreign key/),
  );
  await altered(
    'RENAME TABLE aura_admin_login_guards TO ci_schema_guards_missing',
    'RENAME TABLE ci_schema_guards_missing TO aura_admin_login_guards',
    async()=>await assert.rejects(()=>assertAdminSchema(pool),/transactional table/),
  );

  const [ledger]=await pool.execute('SELECT checksum,applied_at FROM aura_schema_migrations WHERE version=?',['002_admin_auth']);
  assert.equal(ledger.length,1);
  try{
    await pool.execute('UPDATE aura_schema_migrations SET checksum=? WHERE version=?',['0'.repeat(64),'002_admin_auth']);
    await assert.rejects(()=>assertAdminSchema(pool),/checksum/);
    await assert.rejects(()=>applyAdminMigration(pool),/checksum/);
  }finally{
    await pool.execute('UPDATE aura_schema_migrations SET checksum=? WHERE version=?',[ledger[0].checksum,'002_admin_auth']);
  }

  // A pre-existing table cannot be accepted just because CREATE IF NOT EXISTS
  // succeeds: no ledger may be written until the actual schema is correct.
  await pool.execute('DELETE FROM aura_schema_migrations WHERE version=?',['002_admin_auth']);
  try{
    await altered(
      'ALTER TABLE aura_admin_users MODIFY password_hash VARCHAR(200) CHARACTER SET ascii COLLATE ascii_bin NOT NULL',
      'ALTER TABLE aura_admin_users MODIFY password_hash VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL',
      async()=>{
        await assert.rejects(()=>applyAdminMigration(pool),/Required column/);
        const [missing]=await pool.execute('SELECT version FROM aura_schema_migrations WHERE version=?',['002_admin_auth']);
        assert.equal(missing.length,0,'Incorrect pre-existing schema must not be stamped applied');
      },
    );
    assert.equal((await applyAdminMigration(pool)).applied,true);
  }finally{
    await pool.execute('INSERT INTO aura_schema_migrations (version,checksum,applied_at) VALUES (?,?,?) ON DUPLICATE KEY UPDATE checksum=VALUES(checksum),applied_at=VALUES(applied_at)',
      ['002_admin_auth',ledger[0].checksum,ledger[0].applied_at]);
  }
  const concurrent=await Promise.all([applyInitialMigration(pool),applyAdminMigration(pool),applyAdminMigration(pool)]);
  assert.ok(concurrent.every(result=>result.applied===false),'Concurrent migration checks remain idempotent');
  await assertLeadSchema(pool);
  await assertAdminSchema(pool);
  console.log('PASS schema readiness rejects nontransactional engines, missing tables, column/key/FK drift, checksum tampering and unreviewed migration stamping');
}finally{await pool.end();}
