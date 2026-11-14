import { createHash, randomBytes } from 'node:crypto';

const boolean = value => /^(1|true|yes)$/i.test(String(value ?? ''));
const integer = (value, fallback, min, max) => {
  const result = Number(value ?? fallback);
  return Number.isInteger(result) && result >= min && result <= max ? result : fallback;
};

export const CONTACT = Object.freeze({
  phone: '+31858000563',
  email: 'info@thuisbatterijteam.nl',
  url: 'https://thuisbatterijteam.nl/contact/adviesgesprek/',
});

function origin(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.origin : null;
  } catch { return null; }
}

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const siteUrl = origin(env.SITE_URL || 'https://hyxi-aura.nl');
  if (!siteUrl) throw new Error('SITE_URL must be an absolute http(s) origin.');
  const allowedOrigins = new Set([siteUrl]);
  for (const item of (env.ALLOWED_ORIGINS || '').split(',')) {
    if (!item.trim()) continue;
    const parsed = origin(item.trim());
    if (!parsed) throw new Error('ALLOWED_ORIGINS contains an invalid origin.');
    allowedOrigins.add(parsed);
  }
  const smtpPort = integer(env.SMTP_PORT, 465, 1, 65535);
  const smtp = {
    host: String(env.SMTP_HOST || '').trim(),
    port: smtpPort,
    secure: env.SMTP_SECURE === undefined ? smtpPort === 465 : boolean(env.SMTP_SECURE),
    user: String(env.SMTP_USER || '').trim(),
    pass: String(env.SMTP_PASS || ''),
    from: String(env.SMTP_FROM || '').trim(),
    to: String(env.LEAD_TO || 'leads@thuisbatterijteam.nl').trim(),
  };
  const email = /^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/;
  const smtpConfigured = Boolean(smtp.host && smtp.user && smtp.pass && email.test(smtp.from) && email.test(smtp.to));
  const storageMode = String(env.LEAD_STORAGE_MODE || 'mail').trim();
  if (!['mail', 'database'].includes(storageMode)) {
    throw new Error('LEAD_STORAGE_MODE must be mail or database.');
  }
  const db = {
    host: String(env.DB_HOST || '127.0.0.1').trim(),
    port: integer(env.DB_PORT, 3306, 1, 65535),
    name: String(env.DB_NAME || '').trim(),
    user: String(env.DB_USER || '').trim(),
    password: String(env.DB_PASSWORD || ''),
  };
  const dbConfigured = Boolean(db.host && db.name && db.user && db.password);
  const encryptionKey = String(env.LEAD_ENCRYPTION_KEY || '').trim();
  const hashSecret = String(env.LEAD_HASH_SECRET || '');
  const dbSecretsConfigured =
    /^[A-Za-z0-9+/]{43}=$/.test(encryptionKey) &&
    Buffer.from(encryptionKey, 'base64').length === 32 &&
    Buffer.byteLength(hashSecret, 'utf8') >= 32;
  // The admin UI can never be enabled on the SMTP-only website.
  const adminSessionSecret = String(env.ADMIN_SESSION_SECRET || '');
  const adminMfaKey = String(env.ADMIN_MFA_KEY || '');
  const adminConfigured = storageMode === 'database' && dbConfigured &&
    dbSecretsConfigured && Buffer.byteLength(adminSessionSecret, 'utf8') >= 32 &&
    /^[A-Za-z0-9+/]{43}=$/.test(adminMfaKey) &&
    Buffer.from(adminMfaKey, 'base64').length === 32 &&
    Buffer.from(adminMfaKey, 'base64').toString('base64') === adminMfaKey;
  const adminEnabled = boolean(env.ADMIN_ENABLED) && adminConfigured;
  const trustProxyValue = String(env.TRUST_PROXY || 'false');
  // A fixed hop count is deliberate: never blindly trust user-supplied X-Forwarded-For.
  if (!['false', '0', '1', 'loopback'].includes(trustProxyValue)) throw new Error('TRUST_PROXY must be false, 0, 1, or loopback.');
  return {
    production,
    siteUrl,
    allowedOrigins,
    smtp,
    smtpConfigured,
    storageMode,
    db,
    dbConfigured,
    encryptionKey,
    hashSecret,
    adminEnabled,
    adminConfigured,
    adminSessionSecret,
    adminMfaKey,
    leadEnabled: boolean(env.LEAD_ENABLED) && smtpConfigured &&
      (storageMode === 'mail' || (dbConfigured && dbSecretsConfigured)),
    dailyLimit: integer(env.SMTP_DAILY_LIMIT, 100, 1, 1000),
    rateLimit: integer(env.LEAD_RATE_LIMIT, 6, 1, 60),
    rateWindowMs: 15 * 60 * 1000,
    port: integer(env.PORT, 3000, 1, 65535),
    trustProxy: trustProxyValue === '1' ? 1 : trustProxyValue === 'loopback' ? 'loopback' : false,
    csrfSecret: env.CSRF_SECRET && env.CSRF_SECRET.length >= 32 ? env.CSRF_SECRET : randomBytes(32).toString('hex'),
    canonicalRedirect: boolean(env.CANONICAL_REDIRECT),
    hash(value) { return createHash('sha256').update(value).digest('hex'); },
  };
}
