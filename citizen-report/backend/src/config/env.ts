/**
 * Centralized, validated environment configuration.
 * Fails fast at boot if a required variable is missing or malformed.
 */
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const boolish = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? def : v === 'true' || v === '1'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(30),

  // 32-byte key as 64 hex chars.
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'),

  // If unset, the cookie is host-only (correct for both localhost and *.vercel.app).
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: boolish(false),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Cloudinary (private media storage + signed delivery URLs).
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  MAX_UPLOAD_MB: z.coerce.number().default(25),
  MAX_FILES_PER_REPORT: z.coerce.number().default(8),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().default('Citizen Report <no-reply@citizen-report.example>'),
  APP_BASE_URL: z.string().default('http://localhost:3000'),

  CAPTCHA_PROVIDER: z.enum(['hcaptcha', 'recaptcha', 'none']).default('none'),
  CAPTCHA_SECRET: z.string().optional().default(''),

  REDIS_URL: z.string().optional().default(''),

  DATA_RETENTION_DAYS: z.coerce.number().default(365),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
