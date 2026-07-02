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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGoogleAuthSuccess = handleGoogleAuthSuccess;
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.verifyEmail = verifyEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const env_1 = require("../../config/env");
const authService = __importStar(require("./auth.service"));
const models_1 = require("../../models"); // წამოიღებს მოდელებს შენი პროექტიდან
const crypto_1 = __importDefault(require("crypto"));
const jwt_1 = require("../../lib/jwt");
const REFRESH_COOKIE = 'crp_refresh';
function setRefreshCookie(res, token, expiresAt) {
    res.cookie(REFRESH_COOKIE, token, {
        httpOnly: true,
        secure: env_1.isProd, // პროდაქშენზე (Vercel) იქნება true
        // ფრონტი და ბექი სხვადასხვა დომენზეა (citizen-report-frontend... / reports-cyan...),
        // ამიტომ პროდზე ქუქი მხოლოდ SameSite=None-ით გაიგზავნება cross-site fetch-ზე.
        sameSite: env_1.isProd ? 'none' : 'lax',
        domain: env_1.env.COOKIE_DOMAIN,
        path: '/api/auth',
        expires: expiresAt,
    });
}
function clearRefreshCookie(res) {
    // წაშლის Set-Cookie-ს ბრაუზერი მხოლოდ მაშინ იღებს, თუ ატრიბუტები
    // ზუსტად ემთხვევა იმას, რითაც ქუქი დაყენდა (განსაკუთრებით SameSite/Secure).
    res.clearCookie(REFRESH_COOKIE, {
        httpOnly: true,
        secure: env_1.isProd,
        sameSite: env_1.isProd ? 'none' : 'lax',
        domain: env_1.env.COOKIE_DOMAIN,
        path: '/api/auth',
    });
}
function reqMeta(req) {
    return { ip: req.ip, userAgent: req.headers['user-agent']?.toString() };
}
// ⚡ სრულად გამართული და ინტეგრირებული Google Auth ჰენდლერი
async function handleGoogleAuthSuccess(req, res) {
    try {
        // passport-ის google strategy აქ აბრუნებს {email, name, googleId} ობიექტს
        const googleUser = req.user;
        if (!googleUser?.email) {
            return res.redirect(`${env_1.env.APP_BASE_URL}/login?error=no_user_data`);
        }
        const email = googleUser.email;
        const displayName = googleUser.name || 'Google User';
        // 1. ვეძებთ იუზერს ბაზაში
        let user = await models_1.User.findOne({ email });
        // თუ ანგარიში არსებობს, მაგრამ ემაილი ჯერ არ იყო ვერიფიცირებული —
        // Google-მა ეს ემაილი უკვე დაადასტურა, ამიტომ ვერიფიცირებულად ვთვლით
        if (user && !user.emailVerified) {
            await models_1.User.updateOne({ _id: user.id }, { emailVerified: true, verifyToken: null, verifyTokenExpiry: null });
            user.emailVerified = true;
        }
        // 2. თუ იუზერი არ არსებობს, ვქმნით ახალს
        if (!user) {
            // შემთხვევითი პაროლი — ამ ანგარიშით პაროლით შესვლა მაინც შეუძლებელი იქნება,
            // სანამ იუზერი reset-password-ით არ დააყენებს საკუთარს.
            const randomPassword = crypto_1.default.randomBytes(32).toString('hex');
            const bcrypt = (await import('bcryptjs')).default;
            const hashedPassword = await bcrypt.hash(randomPassword, 12);
            user = await models_1.User.create({
                email,
                displayName,
                passwordHash: hashedPassword,
                emailVerified: true, // გუგლიდან შემოსული ავტომატურად ვერიფიცირებულია
            });
        }
        // 3. ტოკენების გენერაცია (ზუსტად ისე, როგორც auth.service აკეთებს)
        const accessToken = (0, jwt_1.signAccessToken)({ sub: user.id, role: user.role, tv: user.tokenVersion });
        const rawRefreshToken = crypto_1.default.randomBytes(48).toString('hex');
        const refreshExpiresAt = new Date(Date.now() + env_1.env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
        const tokenHash = crypto_1.default.createHash('sha256').update(rawRefreshToken).digest('hex');
        const family = crypto_1.default.randomBytes(16).toString('hex');
        // ვინახავთ რეფრეშ ტოკენს მონაცემთა ბაზაში
        await models_1.RefreshToken.create({
            userId: user.id,
            tokenHash: tokenHash,
            family: family,
            expiresAt: refreshExpiresAt,
            createdByIp: reqMeta(req).ip,
            userAgent: reqMeta(req).userAgent?.slice(0, 512),
        });
        // 4. ვსვამთ ქუქის ფრონტენდისთვის
        setRefreshCookie(res, rawRefreshToken, refreshExpiresAt);
        // 5. გადაგვყავს იუზერი ფრონტენდზე და ტოკენი მიგვაქვს URL-ით —
        // /login გვერდი ამ ტოკენს იჭერს, მეხსიერებაში სვამს და დეშბორდზე გადადის
        return res.redirect(`${env_1.env.APP_BASE_URL}/login?token=${encodeURIComponent(accessToken)}`);
    }
    catch (error) {
        console.error("Google Auth Controller Error:", error);
        return res.redirect(`${env_1.env.APP_BASE_URL}/login?error=server_error`);
    }
}
async function register(req, res) {
    const { email, password, displayName } = req.body;
    const user = await authService.register(email, password, displayName);
    res.status(201).json({
        user,
        message: 'Registration successful. Check your email to verify your account.',
    });
}
async function login(req, res) {
    const { email, password } = req.body;
    const { user, tokens } = await authService.login(email, password, reqMeta(req));
    setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
    res.json({ user, accessToken: tokens.accessToken });
}
async function refresh(req, res) {
    const raw = req.cookies?.crp_refresh;
    if (!raw)
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
    const { user, tokens } = await authService.refresh(raw, reqMeta(req));
    setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
    return res.json({ user, accessToken: tokens.accessToken });
}
async function logout(req, res) {
    await authService.logout(req.cookies?.crp_refresh);
    clearRefreshCookie(res);
    res.json({ message: 'Logged out' });
}
async function verifyEmail(req, res) {
    await authService.verifyEmail(req.body.token);
    res.json({ message: 'Email verified. You can now sign in.' });
}
async function forgotPassword(req, res) {
    await authService.forgotPassword(req.body.email);
    res.json({ message: 'If an account exists, a reset link has been sent.' });
}
async function resetPassword(req, res) {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ message: 'Password updated. Please sign in.' });
}
//# sourceMappingURL=auth.controller.js.map