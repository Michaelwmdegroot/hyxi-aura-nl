/**
 * Safety lint only: checks the proposed SQL contains the expected baseline.
 * It does not prove the DDL executes against Hostinger MySQL/MariaDB.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sql = readFileSync(resolve(import.meta.dirname, '..', 'db', 'migrations', '001_initial_leads.sql'), 'utf8');

test('draft migration defines the five auditable tables', () => {
  for (const table of ['aura_schema_migrations','aura_leads','aura_submission_keys','aura_lead_events','aura_notification_outbox']) {
    assert.match(sql, new RegExp('CREATE TABLE IF NOT EXISTS ' + table + '\\s*\\('), table);
  }
});

test('submission idempotency and SMTP notification records cannot duplicate', () => {
  assert.match(sql, /PRIMARY KEY \(key_hash\)/);
  assert.match(sql, /UNIQUE KEY uq_aura_leads_request_id \(request_id\)/);
  assert.match(sql, /UNIQUE KEY uq_aura_notification_lead_type \(lead_id, event_type\)/);
  assert.match(sql, /UNIQUE KEY uq_aura_notification_mail_id \(mail_message_id\)/);
  assert.match(sql, /FOREIGN KEY \(lead_id\) REFERENCES aura_leads\(id\) ON DELETE CASCADE/g);
});

test('lead payload is explicitly encrypted, and audit metadata separate', () => {
  assert.match(sql, /encrypted_payload MEDIUMBLOB NOT NULL/);
  assert.match(sql, /encryption_key_id VARCHAR\(32\)/);
  assert.match(sql, /metadata_json JSON NULL/);
  for (const column of ['full_name', 'email VARCHAR', 'phone VARCHAR', 'postcode VARCHAR']) {
    assert.ok(!sql.includes(column), 'Do not silently add an unencrypted personal-data column');
  }
});

test('MariaDB-compatible engine and UTF-8 are declared', () => {
  const tables = (sql.match(/CREATE TABLE IF NOT EXISTS /g) || []).length;
  const engines = (sql.match(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci/g) || []).length;
  assert.equal(engines, tables);
});

test('schema never creates an account, sends e-mail or populates personal records', () => {
  assert.doesNotMatch(sql, /^\s*(?:GRANT|CREATE USER|INSERT INTO aura_leads|REPLACE INTO aura_leads|DROP TABLE|TRUNCATE)\b/im);
  assert.doesNotMatch(sql, /smtp_pass|db_password|root_password/ig);
});
