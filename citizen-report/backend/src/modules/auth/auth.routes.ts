import { Router } from 'express';
import passport from 'passport'; // <-- ჩაამატე ეს იმპორტი
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
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req: any, res) => {
    // req.user-ში ახლა ზის ის ინფორმაცია, რაც Google-მა დაგვიბრუნა (email, name, googleId)
    // აქ უნდა გამოიძახო შენი თოქენების გენერაციის ფუნქცია კონტროლერიდან (მაგალითად JWT)
    
    try {
      // დროებით, რომ ტესტირება შეძლო და დაინახო, მუშაობს თუ არა, ბრაუზერში გამოვაჩინოთ იუზერი:
      res.json({
        message: "Google Auth წარმატებულია!",
        user: req.user
      });

      /* საბოლოო ვარიანტში, როცა კონტროლერში ამას გადაიტან, კოდი ასეთი იქნება:
        const tokens = await ctrl.generateAuthTokens(req.user); 
        res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true });
        res.redirect(`https://შენი-ფრონტენდ-დომენი.vercel.app/dashboard?token=${tokens.accessToken}`);
      */
    } catch (error) {
      res.status(500).json({ error: "ავტორიზაციისას დაფიქსირდა შეცდომა" });
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