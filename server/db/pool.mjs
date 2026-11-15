import mysql from 'mysql2/promise';
import { assertLeadStructure, assertMigrationChecksum } from './schema-check.mjs';

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
  await assertLeadStructure(pool);
  await assertMigrationChecksum(pool,'001_initial_leads');
}
