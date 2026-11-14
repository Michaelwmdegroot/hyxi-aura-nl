import { randomBytes, createHmac, createCipheriv, createDecipheriv, timingSafeEqual, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

// Offline primitives only. No public routes or accounts are created in this phase.
const scrypt = promisify(scryptCallback);
const opts = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export async function hashAdminPassword(password) {
  if (typeof password !== 'string' || Buffer.byteLength(password) < 14 ||
      Buffer.byteLength(password) > 1024 || password.trim().length < 12 ||
      password.includes('\0')) throw new Error('Password policy not met.');
  const salt = randomBytes(24);
  const derived = await scrypt(password, salt, 64, opts);
  return ['scrypt', 'v1', salt.toString('hex'), derived.toString('hex')].join('$');
}

export async function verifyAdminPassword(password, stored) {
  if (typeof password !== 'string' || Buffer.byteLength(password) > 1024 ||
      typeof stored !== 'string' || !/^scrypt\$v1\$[a-f0-9]{48}\$[a-f0-9]{128}$/.test(stored)) return false;
  const parts = stored.split('$');
  try {
    const candidate = await scrypt(password, Buffer.from(parts[2], 'hex'), 64, opts);
    return timingSafeEqual(candidate, Buffer.from(parts[3], 'hex'));
  } catch { return false; }
}

export function newSessionToken() { return randomBytes(32).toString('base64url'); }
export function hashSessionToken(token, secret) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token) ||
      typeof secret !== 'string' || Buffer.byteLength(secret) < 32)
    throw new Error('Invalid session token or signing secret.');
  return createHmac('sha256', secret).update('aura:session:v1:').update(token).digest('hex');
}

function toBase32(bytes) {
  let bits = 0, value = 0, out = '';
  for (const byte of bytes) {
    value = ((value << 8) | byte) >>> 0;
    bits += 8;
    while (bits >= 5) { out += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
    value &= (1 << bits) - 1;
  }
  if (bits) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}
function fromBase32(secret) {
  if (typeof secret !== 'string' || !/^[A-Z2-7]{32}$/.test(secret)) throw new Error('Invalid TOTP secret.');
  let bits = 0, value = 0;
  const out = [];
  for (const char of secret) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; value &= (1 << bits) - 1; }
  }
  if (out.length !== 20) throw new Error('TOTP secret size mismatch.');
  return Buffer.from(out);
}
export function newTotpSecret() { return toBase32(randomBytes(20)); }
export function totpForStep(secret, step) {
  if (!Number.isSafeInteger(step) || step < 0) throw new Error('Invalid MFA counter.');
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac('sha1', fromBase32(secret)).update(counter).digest();
  return String((digest.readUInt32BE(digest[19] & 15) & 0x7fffffff) % 1000000).padStart(6, '0');
}
export function verifyTotp(secret, code, timestamp = Date.now(), lastAcceptedStep = -1) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code) ||
      !Number.isFinite(timestamp) || timestamp < 0) return null;
  const current = Math.floor(timestamp / 30000);
  for (const step of [current - 1, current, current + 1]) {
    if (step < 0 || step <= lastAcceptedStep) continue;
    if (timingSafeEqual(Buffer.from(totpForStep(secret, step)), Buffer.from(code))) return step;
  }
  return null; // Persist the returned step atomically to reject replays.
}
function mfaKey(raw) {
  if (typeof raw !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(raw)) throw new Error('Invalid MFA encryption key.');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32 || key.toString('base64') !== raw) throw new Error('Invalid MFA encryption key.');
  return key;
}
export function encryptTotp(secret, accountId, key) {
  fromBase32(secret);
  if (!/^[a-f0-9-]{36}$/i.test(String(accountId))) throw new Error('Invalid account ID.');
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', mfaKey(key), iv);
  cipher.setAAD(Buffer.from('aura:mfa:v1:' + accountId));
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), ciphertext]);
}
export function decryptTotp(envelope, accountId, key) {
  try {
    if (!Buffer.isBuffer(envelope) || envelope.length < 30 || envelope[0] !== 1) throw new Error('Bad envelope');
    const decipher = createDecipheriv('aes-256-gcm', mfaKey(key), envelope.subarray(1, 13));
    decipher.setAAD(Buffer.from('aura:mfa:v1:' + accountId));
    decipher.setAuthTag(envelope.subarray(13, 29));
    const secret = Buffer.concat([decipher.update(envelope.subarray(29)), decipher.final()]).toString('utf8');
    fromBase32(secret);
    return secret;
  } catch { throw new Error('MFA decryption/authentication failed.'); }
}
