import { Router } from 'express';
import passport, { googleEnabled } from '../../config/passport';
import { env } from '../../config/env';
import { ApiError } from '../../middleware/error';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimit';
import { verifyCaptcha } from '../../middleware/captcha';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  otpRequestSchema,
  otpVerifySchema,
} from './auth.schema';
import * as ctrl from './auth.controller';

const router = Router();

// All auth routes are tightly rate-limited.
router.use(authLimiter);

// Reject Google routes cleanly when OAuth isn't configured (instead of throwing
// "Unknown authentication strategy 'google'").
const requireGoogle = (
  _req: import('express').Request,
  _res: import('express').Response,
  next: import('express').NextFunction,
) => (googleEnabled ? next() : next(ApiError.badRequest('Google sign-in is not configured')));

/**
 * @openapi
 * /auth/google:
 * get:
 * tags: [Auth]
 * summary: Initiate Google OAuth authentication flow
 */
router.get(
  '/google',
  requireGoogle,
  (req, res, next) =>
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      // Force Google's account chooser so users can switch accounts after
      // logging out (otherwise Google silently reuses the signed-in account).
      prompt: 'select_account',
    })(req, res, next),
);

/**
 * @openapi
 * /auth/google/callback:
 * get:
 * tags: [Auth]
 * summary: Google OAuth callback URL
 */
router.get(
  '/google/callback',
  requireGoogle,
  (req, res, next) =>
    passport.authenticate('google', {
      failureRedirect: `${env.APP_BASE_URL}/login?error=google_auth_failed`,
      session: false,
    })(req, res, next),
  async (req, res) => {
    try {
      // req-ს და res-ს გადავცემთ პირდაპირ კონტროლერს, რომელიც თავად მიხედავს ქუქის და რედირექტს
      await ctrl.handleGoogleAuthSuccess(req, res);
    } catch (error) {
      return res.redirect(`${env.APP_BASE_URL}/login?error=google_auth_failed`);
    }
  }
);

/**
 * @openapi
 * /auth/register:
 * post:
 * tags: [Auth]
 * summary: Register a new citizen account (sends a verification email)
 */
router.post('/register', verifyCaptcha, validate({ body: registerSchema }), ctrl.register);

/**
 * @openapi
 * /auth/login:
 * post:
 * tags: [Auth]
 * summary: Log in; returns an access token and sets an httpOnly refresh cookie
 */
router.post('/login', validate({ body: loginSchema }), ctrl.login);

/**
 * @openapi
 * /auth/refresh:
 * post:
 * tags: [Auth]
 * summary: Rotate the refresh cookie and issue a new access token
 */
router.post('/refresh', ctrl.refresh);

/**
 * @openapi
 * /auth/logout:
 * post:
 * tags: [Auth]
 * summary: Revoke the current session
 */
router.post('/logout', ctrl.logout);

/**
 * @openapi
 * /auth/verify-email:
 * post:
 * tags: [Auth]
 * summary: Verify an email address with the token from the verification email
 */
router.post('/verify-email', validate({ body: verifyEmailSchema }), ctrl.verifyEmail);

router.post('/forgot-password', validate({ body: forgotPasswordSchema }), ctrl.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), ctrl.resetPassword);

// Passwordless email one-time-code sign-in (used for admin/passwordless login).
router.post('/otp/request', validate({ body: otpRequestSchema }), ctrl.requestOtp);
router.post('/otp/verify', validate({ body: otpVerifySchema }), ctrl.verifyOtp);

export default router;