import { Router } from 'express';
import passport from 'passport';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimit';
import { verifyCaptcha } from '../../middleware/captcha';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';
import * as ctrl from './auth.controller';

const router = Router();

// All auth routes are tightly rate-limited.
router.use(authLimiter);

/**
 * @openapi
 * /auth/google:
 * get:
 * tags: [Auth]
 * summary: Initiate Google OAuth authentication flow
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

/**
 * @openapi
 * /auth/google/callback:
 * get:
 * tags: [Auth]
 * summary: Google OAuth callback URL
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: 'https://citizen-report-frontend-gb8gec1tr.vercel.app/login', session: false }),
  async (req, res) => {
    try {
      // req-ს და res-ს გადავცემთ პირდაპირ კონტროლერს, რომელიც თავად მიხედავს ქუქის და რედირექტს
      await ctrl.handleGoogleAuthSuccess(req, res);
    } catch (error) {
      return res.redirect('https://citizen-report-frontend-gb8gec1tr.vercel.app/login?error=google_auth_failed');
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

export default router;