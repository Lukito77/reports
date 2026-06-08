import pino from 'pino';
import { isProd } from '../config/env';

/**
 * Structured logger. Never log secrets or PII. Redaction below covers the most
 * common accidental leaks (auth headers, cookies, passwords, tokens).
 */
export const logger = pino({
  level: isProd ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      '*.password',
      '*.token',
      '*.refreshToken',
    ],
    censor: '[redacted]',
  },
  transport: isProd
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
});
