"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importStar(require("../../config/passport"));
const env_1 = require("../../config/env");
const error_1 = require("../../middleware/error");
const validate_1 = require("../../middleware/validate");
const rateLimit_1 = require("../../middleware/rateLimit");
const captcha_1 = require("../../middleware/captcha");
const auth_schema_1 = require("./auth.schema");
const ctrl = __importStar(require("./auth.controller"));
const router = (0, express_1.Router)();
// All auth routes are tightly rate-limited.
router.use(rateLimit_1.authLimiter);
// Reject Google routes cleanly when OAuth isn't configured (instead of throwing
// "Unknown authentication strategy 'google'").
const requireGoogle = (_req, _res, next) => (passport_1.googleEnabled ? next() : next(error_1.ApiError.badRequest('Google sign-in is not configured')));
/**
 * @openapi
 * /auth/google:
 * get:
 * tags: [Auth]
 * summary: Initiate Google OAuth authentication flow
 */
router.get('/google', requireGoogle, (req, res, next) => passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    // Force Google's account chooser so users can switch accounts after
    // logging out (otherwise Google silently reuses the signed-in account).
    prompt: 'select_account',
})(req, res, next));
/**
 * @openapi
 * /auth/google/callback:
 * get:
 * tags: [Auth]
 * summary: Google OAuth callback URL
 */
router.get('/google/callback', requireGoogle, (req, res, next) => passport_1.default.authenticate('google', {
    failureRedirect: `${env_1.env.APP_BASE_URL}/login?error=google_auth_failed`,
    session: false,
})(req, res, next), async (req, res) => {
    try {
        // req-ს და res-ს გადავცემთ პირდაპირ კონტროლერს, რომელიც თავად მიხედავს ქუქის და რედირექტს
        await ctrl.handleGoogleAuthSuccess(req, res);
    }
    catch (error) {
        return res.redirect(`${env_1.env.APP_BASE_URL}/login?error=google_auth_failed`);
    }
});
/**
 * @openapi
 * /auth/register:
 * post:
 * tags: [Auth]
 * summary: Register a new citizen account (sends a verification email)
 */
router.post('/register', captcha_1.verifyCaptcha, (0, validate_1.validate)({ body: auth_schema_1.registerSchema }), ctrl.register);
/**
 * @openapi
 * /auth/login:
 * post:
 * tags: [Auth]
 * summary: Log in; returns an access token and sets an httpOnly refresh cookie
 */
router.post('/login', (0, validate_1.validate)({ body: auth_schema_1.loginSchema }), ctrl.login);
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
router.post('/verify-email', (0, validate_1.validate)({ body: auth_schema_1.verifyEmailSchema }), ctrl.verifyEmail);
router.post('/forgot-password', (0, validate_1.validate)({ body: auth_schema_1.forgotPasswordSchema }), ctrl.forgotPassword);
router.post('/reset-password', (0, validate_1.validate)({ body: auth_schema_1.resetPasswordSchema }), ctrl.resetPassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map