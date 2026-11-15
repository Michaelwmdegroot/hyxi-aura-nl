import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { hashAdminPassword, verifyAdminPassword, newSessionToken, hashSessionToken, newTotpSecret, totpForStep, verifyTotp, encryptTotp, decryptTotp } from '../server/auth/security.mjs';

test('scrypt password hashes are salted, strong and verify in constant time', async () => {
  const pwd = 'LangeVeiligeZin~VoorBeheer-2026';
  const a = await hashAdminPassword(pwd), b = await hashAdminPassword(pwd);
  assert.notEqual(a, b);
  assert.equal(await verifyAdminPassword(pwd, a), true);
  assert.equal(await verifyAdminPassword(pwd + 'x', a), false);
  assert.equal(await verifyAdminPassword(pwd, 'broken'), false);
  await assert.rejects(() => hashAdminPassword('password123'));
  await assert.rejects(() => hashAdminPassword('a'.repeat(1100)));
});

test('session tokens are unpredictable and only stored as keyed hashes', () => {
  const a = newSessionToken(), b = newSessionToken(), key = randomBytes(32).toString('hex');
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(a, b);
  assert.match(hashSessionToken(a, key), /^[a-f0-9]{64}$/);
  assert.notEqual(hashSessionToken(a, key), hashSessionToken(b, key));
  assert.throws(() => hashSessionToken('bad', key));
  assert.throws(() => hashSessionToken(a, 'weak'));
});

test('TOTP checks bounded clock skew and rejects replays', () => {
  const secret = newTotpSecret(), step = 1200000, t = step * 30000 + 5000;
  assert.match(secret, /^[A-Z2-7]{32}$/);
  const code = totpForStep(secret, step);
  assert.equal(verifyTotp(secret, code, t), step);
  assert.equal(verifyTotp(secret, code, t, step), null);
  assert.equal(verifyTotp(secret, code, t + 90000), null);
  assert.equal(verifyTotp(secret, '9999999', t), null);
  assert.equal(verifyTotp(secret, totpForStep(secret, step + 1), t), step + 1);
});

test('MFA seed encryption is authenticated and bound to account and encryption key', () => {
  const secret = newTotpSecret(), id = randomUUID(), key = randomBytes(32).toString('base64');
  const encrypted = encryptTotp(secret, id, key);
  assert.equal(decryptTotp(encrypted, id, key), secret);
  assert.equal(encrypted.includes(Buffer.from(secret)), false);
  assert.throws(() => decryptTotp(encrypted, randomUUID(), key));
  assert.throws(() => decryptTotp(encrypted, id, randomBytes(32).toString('base64')));
  const altered = Buffer.from(encrypted); altered[altered.length - 1] ^= 1;
  assert.throws(() => decryptTotp(altered, id, key));
});
