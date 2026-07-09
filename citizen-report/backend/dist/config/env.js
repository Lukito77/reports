"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProd = exports.env = void 0;
/**
 * Centralized, validated environment configuration.
 * Fails fast at boot if a required variable is missing or malformed.
 */
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const boolish = (def) => zod_1.z
    .string()
    .optional()
    .transform((v) => (v === undefined ? def : v === 'true' || v === '1'));
const schema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
    JWT_ACCESS_TTL: zod_1.z.string().default('15m'),
    JWT_REFRESH_TTL_DAYS: zod_1.z.coerce.number().default(30),
    // 32-byte key as 64 hex chars.
    ENCRYPTION_KEY: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'),
    // If unset, the cookie is host-only (correct for both localhost and *.vercel.app).
    COOKIE_DOMAIN: zod_1.z.string().optional(),
    COOKIE_SECURE: boolish(false),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    // Cloudinary (private media storage + signed delivery URLs).
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1, 'CLOUDINARY_API_KEY is required'),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
    MAX_UPLOAD_MB: zod_1.z.coerce.number().default(25),
    MAX_FILES_PER_REPORT: zod_1.z.coerce.number().default(8),
    SMTP_HOST: zod_1.z.string().optional().default(''),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_USER: zod_1.z.string().optional().default(''),
    SMTP_PASS: zod_1.z.string().optional().default(''),
    SMTP_FROM: zod_1.z.string().default('Reports <no-reply@citizen-report.example>'),
    // trim — env მნიშვნელობაში გაპარულმა \r/\n-მა redirect ჰედერი არ გატეხოს
    APP_BASE_URL: zod_1.z.string().trim().default('http://localhost:3000'),
    CAPTCHA_PROVIDER: zod_1.z.enum(['hcaptcha', 'recaptcha', 'none']).default('none'),
    CAPTCHA_SECRET: zod_1.z.string().optional().default(''),
    REDIS_URL: zod_1.z.string().optional().default(''),
    DATA_RETENTION_DAYS: zod_1.z.coerce.number().default(365),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment configuration:');
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
exports.isProd = exports.env.NODE_ENV === 'production';
//# sourceMappingURL=env.js.map