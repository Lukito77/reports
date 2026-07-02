/**
 * AES-256-GCM field encryption for sensitive data at rest (e.g. anonymous
 * reporter contact, detected plate text), plus token hashing helpers.
 */
import crypto from 'crypto';
import { env } from '../config/env';

const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex'); // 32 bytes
const IV_LEN = 12;
const ALGO = 'aes-256-gcm';

/** Encrypts a UTF-8 string. Returns base64 of iv|tag|ciphertext, or null for empty input. */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === '') return null;
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

/** Decrypts a value produced by `encrypt`. Returns null on empty/invalid input. */
export function decrypt(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + 16);
    const ciphertext = buf.subarray(IV_LEN + 16);
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/** SHA-256 hex digest — used to store refresh tokens without keeping the raw value. */
export function sha256(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/** Cryptographically strong random URL-safe token. */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Cryptographically strong numeric one-time code, zero-padded to `digits`. */
export function randomOtp(digits = 6): string {
  return crypto.randomInt(0, 10 ** digits).toString().padStart(digits, '0');
}
