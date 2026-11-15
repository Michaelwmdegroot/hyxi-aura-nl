/** No public reset link: all account changes require the trusted server TTY. */
import { loadConfig } from '../server/config.mjs';
import { createLeadPool } from '../server/db/pool.mjs';
import { validAdminPassword } from '../server/auth/security.mjs';
import {
  listAdminAccounts, createAdminAccount, resetAdminAccount,
  disableAdminAccount, revokeAdminSessions, AccountOperationError,
} from '../server/auth/accounts.mjs';
import { requirePrivateTerminal, askVisible, askHidden } from './terminal-input.mjs';

const refusal = 'Accountbeheer geweigerd. Gebruik --manage-accounts en ADMIN_OPERATIONS=interactive-confirmed in een vertrouwde, niet-opgenomen interactieve terminal.';
const messages = {
  INVALID_EMAIL: 'Het e-mailadres is ongeldig.',
  INVALID_ROLE: 'Kies admin of sales.',
  INVALID_ACCOUNT: 'Het geselecteerde account is ongeldig.',
  ACCOUNT_NOT_FOUND: 'Het account bestaat niet meer.',
  ACCOUNT_EXISTS: 'Er bestaat al een account met dit e-mailadres.',
  FIRST_OWNER_REQUIRED: 'Maak eerst de eigenaar aan met admin:create.',
  LAST_ACTIVE_ADMIN: 'De laatste actieve beheerder kan niet worden uitgeschakeld.',
  PASSWORD_POLICY: 'Gebruik één Beheer-wachtwoord van minimaal 12 tekens (maximaal 1024 bytes).',
  INVALID_CONFIGURATION: 'Database- of beveiligingsconfiguratie is onvolledig.',
  SCHEMA_NOT_READY: 'Voer eerst de gecontroleerde account-auditmigratie 003 uit.',
  BUSY: 'Een andere beheeractie is actief; probeer later opnieuw.',
};

async function enrollment() {
  const password = await askHidden('Inlogwachtwoord (minimaal 12 tekens): ');
  if (!validAdminPassword(password)) throw new AccountOperationError('PASSWORD_POLICY');
  return {password};
}

async function run() {
  requirePrivateTerminal();
  const config = loadConfig();
  // Provisioning intentionally works before LEAD_STORAGE_MODE or
  // ADMIN_ENABLED is switched on. It does not open any HTTP route.
  if (!config.dbConfigured) {
    throw new AccountOperationError('INVALID_CONFIGURATION');
  }
  const pool = createLeadPool(config);
  try {
    console.log('HYXI AURA Beheer — accounts op de vertrouwde server');
    console.log('Deze procedure verzendt geen e-mails en opent geen publieke herstelroute.');
    const accounts = await listAdminAccounts(pool);
    for (const [index, account] of accounts.entries()) {
      console.log(`${index + 1}. ${account.email} · ${account.role} · ${account.disabled ? 'uitgeschakeld' : 'actief'}`);
    }
    if (!accounts.length) console.log('Nog geen accounts. Gebruik eerst admin:create.');
    console.log('Acties: list, create, reset, disable, revoke.');
    const action = await askVisible('Actie: ');
    if (action === 'list') return;
    if (!['create', 'reset', 'disable', 'revoke'].includes(action)) throw new Error('Unknown operation.');
    if (action === 'create') {
      const email = await askVisible('E-mailadres nieuw account: ');
      const role = await askVisible('Rol (admin of sales): ');
      if (!['admin', 'sales'].includes(role)) throw new AccountOperationError('INVALID_ROLE');
      if (email.length < 6 || email.length > 254 || /[\u0000-\u001f\u007f-\u009f]/.test(email) ||
          !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) throw new AccountOperationError('INVALID_EMAIL');
      if (await askVisible(`Typ AANMAKEN om een ${role}-account te maken: `) !== 'AANMAKEN') throw new Error('Cancelled.');
      const prepared = await enrollment(email);
      const account = await createAdminAccount({ pool, email, role, ...prepared });
      console.log('Account aangemaakt: ' + account.email + '.');
      return;
    }
    const selected = await askVisible('Accountnummer uit bovenstaande lijst: ');
    const index = /^\d+$/.test(selected) ? Number(selected) - 1 : -1;
    if (!Number.isSafeInteger(index) || index < 0 || index >= accounts.length) throw new Error('Invalid selection.');
    const account = accounts[index];
    if (action === 'reset') {
      console.log('Herstel vervangt het wachtwoord en trekt alle sessies in. Een uitgeschakeld account blijft uitgeschakeld.');
      console.log('Verifieer de identiteit van de accounthouder rechtstreeks voordat je doorgaat.');
      if (await askVisible('Typ HERSTEL ' + account.email + ' na identiteitscontrole: ') !== 'HERSTEL ' + account.email) throw new Error('Recovery not confirmed.');
      if (Buffer.byteLength(config.adminSessionSecret) < 32) throw new AccountOperationError('INVALID_CONFIGURATION');
      const prepared = await enrollment();
      const result = await resetAdminAccount({pool,userId:account.id,...prepared,sessionSecret:config.adminSessionSecret});
      console.log('Wachtwoord vervangen; sessies ingetrokken: ' + result.revokedSessions + '.');
      console.log(result.disabled ? 'Het account blijft uitgeschakeld.' : 'Log in met je nieuwe wachtwoord.');
    } else {
      const verb = action === 'disable' ? 'UITSCHAKELEN' : 'INTREKKEN';
      if (await askVisible(`Typ ${verb} ${account.email} om te bevestigen: `) !== `${verb} ${account.email}`) throw new Error('Cancelled.');
      const result = await (action === 'disable' ? disableAdminAccount : revokeAdminSessions)({ pool, userId: account.id });
      console.log(action === 'disable' ? 'Account uitgeschakeld.' : 'Bestaande sessies ingetrokken; het account kan opnieuw inloggen.');
      console.log('Ingetrokken sessies: ' + result.revokedSessions + '.');
    }
  } finally { await pool.end().catch(() => {}); }
}

if (process.argv.length !== 3 || process.argv[2] !== '--manage-accounts' ||
    process.env.ADMIN_OPERATIONS !== 'interactive-confirmed' || !process.stdin.isTTY || !process.stdout.isTTY) {
  console.error(refusal);
  process.exitCode = 1;
} else {
  try { await run(); }
  catch (error) {
    // Raw SQL/network errors may contain credentials or private host details.
    console.error(error instanceof AccountOperationError && messages[error.code]
      ? messages[error.code]
      : 'Accountbewerking niet voltooid. Controleer invoer, migratie en configuratie in de vertrouwde omgeving.');
    process.exitCode = 1;
  }
}
