import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

export function parseEncryptionKey(input) {
  if (typeof input !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(input)) {
    throw new Error('LEAD_ENCRYPTION_KEY must be a 32-byte base64 secret.');
  }
  const key = Buffer.from(input, 'base64');
  if (key.length !== 32 || key.toString('base64') !== input) {
    throw new Error('LEAD_ENCRYPTION_KEY must be a canonical 32-byte base64 secret.');
  }
  return key;
}

export function parseHashKey(input) {
  if (typeof input !== 'string' || Buffer.byteLength(input, 'utf8') < 32) {
    throw new Error('LEAD_HASH_SECRET must be at least 32 bytes.');
  }
  return Buffer.from(input, 'utf8');
}

export function keyedHash(secret, content) {
  return createHmac('sha256', secret).update(content).digest('hex');
}

export function sealLead(lead, leadId, key, keyId = 'v1') {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(leadId + ':' + keyId));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(lead), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([1]), iv, tag, encrypted]);
}

export function openLead(payload, leadId, key, keyId = 'v1') {
  try {
    const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
    if (data.length < 30 || data[0] !== 1) throw new Error('Invalid envelope');
    const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(1, 13));
    decipher.setAAD(Buffer.from(leadId + ':' + keyId));
    decipher.setAuthTag(data.subarray(13, 29));
    const plain = Buffer.concat([decipher.update(data.subarray(29)), decipher.final()]);
    return JSON.parse(plain.toString('utf8'));
  } catch {
    throw new Error('Lead decryption/authentication failed.');
  }
}
