/**
 * Secure one-time HYXI AURA owner bootstrap (interactive TTY only).
 * This script NEVER runs during npm start, build or deploy.
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../server/config.mjs';
import { createLeadPool } from '../server/db/pool.mjs';
import { validAdminPassword } from '../server/auth/security.mjs';
import { createFirstAdmin } from '../server/auth/bootstrap.mjs';
import { assertAccountManagementSchema } from '../server/auth/accounts.mjs';
import { requirePrivateTerminal, askVisible, askHidden } from './terminal-input.mjs';

// Dependency injection is for offline verification of preparation order.
// The executable path below always supplies the real TTY and database checks.
export async function runOwnerBootstrap({
  env = process.env,
  requireTerminal = requirePrivateTerminal,
  createPool = createLeadPool,
  checkSchema = assertAccountManagementSchema,
  visible = askVisible,
  hidden = askHidden,
  writeLine = console.log,
  createOwner = createFirstAdmin,
} = {}) {
  requireTerminal();
  const cfg = loadConfig(env);
  // First owner creation only needs the already-validated database.
  if (!cfg.dbConfigured) throw new Error('Database configuration is incomplete.');
  const pool = createPool(cfg);
  try {
    // Fail before asking for a password or showing an enrollment secret.
    await checkSchema(pool);
    const [existing] = await pool.query('SELECT COUNT(*) AS total FROM aura_admin_users');
    if (Number(existing[0]?.total) !== 0) throw new Error('An owner already exists; use audited account management.');
    writeLine('HYXI AURA Beheer — eerste eigenaar (eenmalige inrichting)');
    writeLine('Je logt in met één wachtwoord, zonder authenticator.');
    const email = await visible('E-mailadres eigenaar: ');
    if (email.length < 6 || email.length > 254 || /[\u0000-\u001f\u007f-\u009f]/.test(email) ||
        !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) throw new Error('Invalid owner email.');
    const password = await hidden('Inlogwachtwoord (minimaal 12 tekens): ');
    if (!validAdminPassword(password)) throw new Error('PASSWORD_POLICY');
    const account = await createOwner({pool,email,password});
    writeLine('Beheeraccount aangemaakt: ' + account.email + '.');
    return account;
  } finally { await pool.end().catch(() => {}); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || process.argv[2] !== '--create-first-owner' ||
      process.env.ADMIN_BOOTSTRAP !== 'interactive-confirmed' || !process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('Owner bootstrap refused. Use --create-first-owner and ADMIN_BOOTSTRAP=interactive-confirmed in a private interactive terminal.');
    process.exitCode = 1;
  } else {
    try { await runOwnerBootstrap(); }
    catch (error) {
      // Only known, non-sensitive validation errors are shown. Never echo
      // passwords, MFA secrets, SQL, hostnames or internal errors to a TTY.
      const safeMessages = {
        PASSWORD_POLICY: 'Gebruik één Beheer-wachtwoord van minimaal 12 tekens (maximaal 1024 bytes).',
        'Invalid owner email.': 'Het e-mailadres is ongeldig.',
        'Database configuration is incomplete.': 'Databaseconfiguratie ontbreekt in deze terminal.',
        'An owner already exists; use audited user management.': 'Er is al een eigenaaraccount. Gebruik admin:manage.',
      };
      console.error(safeMessages[error?.message] ||
        'Eigenaaraccount niet aangemaakt. Controleer de privéconfiguratie en database; er zijn geen wachtwoorden gelogd.');
      process.exitCode = 1;
    }
  }
}
