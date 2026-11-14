import mysql from 'mysql2/promise';

export function createLeadPool(config) {
  if (!config?.db?.host || !config?.db?.name || !config?.db?.user || !config?.db?.password) {
    throw new Error('Complete Hostinger DB configuration is required for database storage.');
  }
  return mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    waitForConnections: true,
    connectionLimit: 3,
    maxIdle: 2,
    idleTimeout: 30000,
    connectTimeout: 10000,
    timezone: 'Z',
    namedPlaceholders: false,
    multipleStatements: false,
    supportBigNumbers: true,
    dateStrings: false,
  });
}

export async function assertLeadSchema(pool) {
  for (const table of [
    'aura_schema_migrations',
    'aura_leads',
    'aura_submission_keys',
    'aura_lead_events',
    'aura_notification_outbox',
  ]) {
    // Fixed identifiers, not derived from user input.
    await pool.query('SELECT 1 FROM ' + table + ' LIMIT 0');
  }
  const [rows] = await pool.execute(
    'SELECT version FROM aura_schema_migrations WHERE version = ? LIMIT 1',
    ['001_initial_leads'],
  );
  if (rows.length !== 1) throw new Error('HYXI database migration 001 is not applied.');
}
