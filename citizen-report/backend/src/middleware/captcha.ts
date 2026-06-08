/**
 * CAPTCHA verification middleware. Supports hCaptcha and reCAPTCHA. When
 * CAPTCHA_PROVIDER=none (dev), it is a no-op so flows still work locally.
 * Expects the client token in the `x-captcha-token` header or `captchaToken` body field.
 */
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from './error';
import { logger } from '../lib/logger';

const VERIFY_URL: Record<string, string> = {
  hcaptcha: 'https://hcaptcha.com/siteverify',
  recaptcha: 'https://www.google.com/recaptcha/api/siteverify',
};

export async function verifyCaptcha(req: Request, _res: Response, next: NextFunction) {
  if (env.CAPTCHA_PROVIDER === 'none') return next();

  const token =
    (req.headers['x-captcha-token'] as string | undefined) ||
    (req.body && (req.body.captchaToken as string | undefined));
  if (!token) return next(ApiError.badRequest('CAPTCHA token missing'));

  try {
    const body = new URLSearchParams({ secret: env.CAPTCHA_SECRET, response: token });
    const resp = await fetch(VERIFY_URL[env.CAPTCHA_PROVIDER], { method: 'POST', body });
    const data = (await resp.json()) as { success: boolean };
    if (!data.success) return next(ApiError.badRequest('CAPTCHA verification failed'));
    next();
  } catch (err) {
    logger.error({ err }, 'CAPTCHA provider error');
    next(ApiError.badRequest('CAPTCHA verification unavailable'));
  }
}
