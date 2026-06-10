"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.sha256 = sha256;
exports.randomToken = randomToken;
/**
 * AES-256-GCM field encryption for sensitive data at rest (e.g. anonymous
 * reporter contact, detected plate text), plus token hashing helpers.
 */
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const KEY = Buffer.from(env_1.env.ENCRYPTION_KEY, 'hex'); // 32 bytes
const IV_LEN = 12;
const ALGO = 'aes-256-gcm';
/** Encrypts a UTF-8 string. Returns base64 of iv|tag|ciphertext, or null for empty input. */
function encrypt(plaintext) {
    if (plaintext == null || plaintext === '')
        return null;
    const iv = crypto_1.default.randomBytes(IV_LEN);
    const cipher = crypto_1.default.createCipheriv(ALGO, KEY, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}
/** Decrypts a value produced by `encrypt`. Returns null on empty/invalid input. */
function decrypt(payload) {
    if (!payload)
        return null;
    try {
        const buf = Buffer.from(payload, 'base64');
        const iv = buf.subarray(0, IV_LEN);
        const tag = buf.subarray(IV_LEN, IV_LEN + 16);
        const ciphertext = buf.subarray(IV_LEN + 16);
        const decipher = crypto_1.default.createDecipheriv(ALGO, KEY, iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    }
    catch {
        return null;
    }
}
/** SHA-256 hex digest — used to store refresh tokens without keeping the raw value. */
function sha256(input) {
    return crypto_1.default.createHash('sha256').update(input).digest('hex');
}
/** Cryptographically strong random URL-safe token. */
function randomToken(bytes = 32) {
    return crypto_1.default.randomBytes(bytes).toString('hex');
}
//# sourceMappingURL=crypto.js.map