/**
 * Secure one-time HYXI AURA owner bootstrap (interactive TTY only).
 * This script NEVER runs during npm start, build or deploy.
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../server/config.mjs';
import { createLeadPool } from '../server/db/pool.mjs';
import { newTotpSecret, validAdminPassword } from '../server/auth/security.mjs';
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
  // Provisioning must work while the public site still uses mail mode.
  // adminConfigured depends on activation storage mode; preparation requires
  // the DB and independent admin secrets without opening any HTTP route.
  if (!cfg.dbConfigured || Buffer.byteLength(cfg.adminSessionSecret) < 32 ||
      !/^[A-Za-z0-9+/]{43}=$/.test(cfg.adminMfaKey) ||
      Buffer.from(cfg.adminMfaKey, 'base64').length !== 32 ||
      Buffer.from(cfg.adminMfaKey, 'base64').toString('base64') !== cfg.adminMfaKey) {
    throw new Error('Complete DB and independent admin secrets must be set securely first.');
  }
  const pool = createPool(cfg);
  try {
    // Fail before asking for a password or showing an enrollment secret.
    await checkSchema(pool);
    const [existing] = await pool.query('SELECT COUNT(*) AS total FROM aura_admin_users');
    if (Number(existing[0]?.total) !== 0) throw new Error('An owner already exists; use audited account management.');
    writeLine('HYXI AURA Beheer — eerste eigenaar (eenmalige inrichting)');
    writeLine('Gebruik uitsluitend een vertrouwde, niet-opgenomen terminal; deel de MFA-instelsleutel niet.');
    const email = await visible('E-mailadres eigenaar: ');
    if (email.length < 6 || email.length > 254 || /[\u0000-\u001f\u007f-\u009f]/.test(email) ||
        !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) throw new Error('Invalid owner email.');
    // One login password. Duplicate hidden input was unreliable in the
    // Hostinger browser terminal; TOTP remains a required second factor.
    const password = await hidden('Wachtwoord voor Beheer (minimaal 12 tekens): ');
    if (!validAdminPassword(password)) throw new Error('PASSWORD_POLICY');
    const seed = newTotpSecret();
    const uri = 'otpauth://totp/' + encodeURIComponent('HYXI AURA Beheer:' + email) +
      '?secret=' + seed + '&issuer=' + encodeURIComponent('HYXI AURA Beheer') + '&digits=6&period=30';
    writeLine('Voeg dit account handmatig toe aan jouw authenticator:');
    writeLine('Eenmalige geheime instelsleutel: ' + seed);
    writeLine('Authenticator URI: ' + uri);
    const code = await hidden('Bevestig met een actuele 6-cijferige code: ');
    const account = await createOwner({
      pool, email, password, totpSecret: seed, confirmationCode: code, mfaKey: cfg.adminMfaKey,
    });
    writeLine('Eerste beheerder aangemaakt: ' + account.email + '. Wacht op een nieuwe authenticatorcode voordat je inlogt.');
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
        'Authenticator confirmation failed.': 'De 6-cijferige authenticatorcode klopt niet of is verlopen.',
        'An owner already exists; use audited user management.': 'Er is al een eigenaaraccount. Gebruik admin:manage.',
      };
      console.error(safeMessages[error?.message] ||
        'Eigenaaraccount niet aangemaakt. Controleer de privéconfiguratie en database; er zijn geen wachtwoorden gelogd.');
      process.exitCode = 1;
    }
  }
}
