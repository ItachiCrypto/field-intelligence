import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM helpers for OAuth token storage.
 *
 * Key handling:
 *   The previous implementation accepted ANY CRM_ENCRYPTION_KEY and coerced it
 *   to 32 bytes by `padEnd(32, '0')`. That meant a dev typing `CRM_ENCRYPTION_KEY=dev`
 *   silently got the key `dev00000000000000000000000000000` — catastrophic entropy
 *   against an attacker with a DB dump. We now REQUIRE a 64-character hex string
 *   (= 32 bytes of real entropy) and refuse to start otherwise.
 *
 *   Generate with:
 *     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * On-wire format stays backwards compatible: `<ivHex>:<authTagHex>:<cipherHex>`.
 */

const ALGORITHM = 'aes-256-gcm';
const HEX_KEY_LENGTH = 64; // 32 bytes * 2 hex chars
const IV_BYTES = 12; // GCM recommends 96-bit IV
const AUTH_TAG_BYTES = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.CRM_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('CRM_ENCRYPTION_KEY is not set');
  }
  if (raw.length !== HEX_KEY_LENGTH || !/^[0-9a-fA-F]+$/.test(raw)) {
    throw new Error(
      'CRM_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  cachedKey = Buffer.from(raw, 'hex');
  if (cachedKey.length !== 32) {
    // Should be unreachable given the regex above, but be defensive.
    cachedKey = null;
    throw new Error('CRM_ENCRYPTION_KEY did not decode to 32 bytes');
  }
  return cachedKey;
}

export function encrypt(text: string): string {
  if (typeof text !== 'string') {
    throw new Error('encrypt() expects a string');
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedText: string): string {
  if (typeof encryptedText !== 'string') {
    throw new Error('decrypt() expects a string');
  }
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  // Backwards compat: older ciphertexts used 16-byte IVs. AES-GCM accepts
  // any IV length via createDecipheriv, so we do not enforce IV_BYTES here —
  // but we DO require the auth tag to be exactly 16 bytes.
  if (authTag.length !== AUTH_TAG_BYTES) {
    throw new Error('Invalid auth tag length');
  }
  if (iv.length < 12) {
    throw new Error('Invalid IV length');
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted, 'hex'),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
