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
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.verifyEmail = verifyEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const env_1 = require("../../config/env");
const authService = __importStar(require("./auth.service"));
const REFRESH_COOKIE = 'crp_refresh';
function setRefreshCookie(res, token, expiresAt) {
    res.cookie(REFRESH_COOKIE, token, {
        httpOnly: true,
        secure: env_1.env.COOKIE_SECURE || env_1.isProd,
        sameSite: 'strict',
        domain: env_1.env.COOKIE_DOMAIN,
        path: '/api/auth',
        expires: expiresAt,
    });
}
function clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth', domain: env_1.env.COOKIE_DOMAIN });
}
function reqMeta(req) {
    return { ip: req.ip, userAgent: req.headers['user-agent']?.toString() };
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