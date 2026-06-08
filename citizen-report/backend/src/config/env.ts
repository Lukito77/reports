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

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(30),

  // 32-byte key as 64 hex chars.
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'),

  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: boolish(false),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  S3_ENDPOINT: z.string().min(1),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: boolish(true),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().default(300),

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
