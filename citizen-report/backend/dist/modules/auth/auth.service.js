"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.verifyEmail = verifyEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
/**
 * Auth domain logic: registration, login, refresh-token rotation (with reuse
 * detection), email verification, and password reset.
 */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../../models");
const enums_1 = require("../../models/enums");
const env_1 = require("../../config/env");
const jwt_1 = require("../../lib/jwt");
const crypto_1 = require("../../lib/crypto");
const error_1 = require("../../middleware/error");
const mailer_1 = require("../../lib/mailer");
const BCRYPT_COST = 12;
const RESET_TTL_MS = 60 * 60 * 1000;
function publicUser(u) {
    return {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        permissions: (0, enums_1.effectivePermissions)(u.role, u.permissions),
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
    };
}
/** Issues an access token + a fresh refresh token belonging to a (possibly new) family. */
async function issueTokens(user, family, meta) {
    const accessToken = (0, jwt_1.signAccessToken)({ sub: user.id, role: user.role, tv: user.tokenVersion });
    const refreshToken = (0, crypto_1.randomToken)(48);
    const refreshExpiresAt = new Date(Date.now() + env_1.env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    await models_1.RefreshToken.create({
        userId: user.id,
        tokenHash: (0, crypto_1.sha256)(refreshToken),
        family,
        expiresAt: refreshExpiresAt,
        createdByIp: meta.ip,
        userAgent: meta.userAgent?.slice(0, 512),
    });
    return { accessToken, refreshToken, refreshExpiresAt };
}
async function register(email, password, displayName) {
    const existing = await models_1.User.findOne({ email });
    if (existing)
        throw error_1.ApiError.conflict('An account with this email already exists');
    const passwordHash = await bcryptjs_1.default.hash(password, BCRYPT_COST);
    // No transactional email provider is configured for the deployment, so a
    // verification link could never reach the user. Accounts are therefore
    // created already verified — consistent with the Google sign-in flow.
    const user = await models_1.User.create({
        email,
        passwordHash,
        displayName,
        emailVerified: true,
    });
    return publicUser(user);
}
async function login(email, password, meta) {
    const user = await models_1.User.findOne({ email });
    // Constant-ish response: always run a hash compare to reduce user enumeration timing.
    const ok = user
        ? await bcryptjs_1.default.compare(password, user.passwordHash)
        : await bcryptjs_1.default.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv');
    if (!user || !ok)
        throw error_1.ApiError.unauthorized('Invalid email or password');
    // Backfill accounts created before verification was dropped (no mail provider).
    if (!user.emailVerified) {
        await models_1.User.updateOne({ _id: user.id }, { emailVerified: true, verifyToken: null, verifyTokenExpiry: null });
        user.emailVerified = true;
    }
    const family = (0, crypto_1.randomToken)(16);
    const tokens = await issueTokens(user, family, meta);
    return { user: publicUser(user), tokens };
}
/**
 * Rotates a refresh token. If a previously-rotated (revoked) token is presented,
 * we treat it as theft and revoke the whole family.
 */
async function refresh(rawToken, meta) {
    const tokenHash = (0, crypto_1.sha256)(rawToken);
    const stored = await models_1.RefreshToken.findOne({ tokenHash });
    if (!stored)
        throw error_1.ApiError.unauthorized('Invalid refresh token');
    if (stored.revokedAt || stored.expiresAt < new Date()) {
        // Reuse of a revoked token => compromise. Nuke the family.
        await models_1.RefreshToken.updateMany({ family: stored.family, revokedAt: null }, { revokedAt: new Date() });
        throw error_1.ApiError.unauthorized('Refresh token reuse detected; session revoked');
    }
    const user = await models_1.User.findById(stored.userId);
    if (!user)
        throw error_1.ApiError.unauthorized();
    const next = await issueTokens(user, stored.family, meta);
    await models_1.RefreshToken.updateOne({ _id: stored.id }, { revokedAt: new Date(), replacedBy: (0, crypto_1.sha256)(next.refreshToken) });
    return { user: publicUser(user), tokens: next };
}
/** Revokes a single refresh token (logout) and the rest of its family. */
async function logout(rawToken) {
    if (!rawToken)
        return;
    const stored = await models_1.RefreshToken.findOne({ tokenHash: (0, crypto_1.sha256)(rawToken) });
    if (!stored)
        return;
    await models_1.RefreshToken.updateMany({ family: stored.family, revokedAt: null }, { revokedAt: new Date() });
}
async function verifyEmail(token) {
    const user = await models_1.User.findOne({ verifyToken: token });
    if (!user || !user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
        throw error_1.ApiError.badRequest('Invalid or expired verification token');
    }
    await models_1.User.updateOne({ _id: user.id }, { emailVerified: true, verifyToken: null, verifyTokenExpiry: null });
}
async function forgotPassword(email) {
    const user = await models_1.User.findOne({ email });
    // Always return success to avoid user enumeration.
    if (!user)
        return;
    const resetToken = (0, crypto_1.randomToken)(32);
    await models_1.User.updateOne({ _id: user.id }, { resetToken, resetTokenExpiry: new Date(Date.now() + RESET_TTL_MS) });
    await (0, mailer_1.sendPasswordResetEmail)(email, resetToken);
}
async function resetPassword(token, password) {
    const user = await models_1.User.findOne({ resetToken: token });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        throw error_1.ApiError.badRequest('Invalid or expired reset token');
    }
    const passwordHash = await bcryptjs_1.default.hash(password, BCRYPT_COST);
    await models_1.User.updateOne({ _id: user.id }, {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        // Invalidate all existing access tokens and refresh sessions.
        $inc: { tokenVersion: 1 },
    });
    await models_1.RefreshToken.updateMany({ userId: user.id, revokedAt: null }, { revokedAt: new Date() });
}
//# sourceMappingURL=auth.service.js.map