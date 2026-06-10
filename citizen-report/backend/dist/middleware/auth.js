"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
exports.requireVerified = requireVerified;
const models_1 = require("../models");
const jwt_1 = require("../lib/jwt");
const error_1 = require("./error");
function extractToken(req) {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer '))
        return header.slice(7);
    return null;
}
async function resolveUser(token) {
    let payload;
    try {
        payload = (0, jwt_1.verifyAccessToken)(token);
    }
    catch {
        return null;
    }
    const user = await models_1.User.findById(payload.sub).select('role emailVerified tokenVersion');
    // Reject tokens issued before the latest tokenVersion bump (logout/pw change).
    if (!user || user.tokenVersion !== payload.tv)
        return null;
    return { id: user.id, role: user.role, emailVerified: user.emailVerified };
}
async function requireAuth(req, _res, next) {
    const token = extractToken(req);
    if (!token)
        return next(error_1.ApiError.unauthorized());
    const user = await resolveUser(token);
    if (!user)
        return next(error_1.ApiError.unauthorized('Invalid or expired token'));
    req.user = user;
    next();
}
async function optionalAuth(req, _res, next) {
    const token = extractToken(req);
    if (token) {
        const user = await resolveUser(token);
        if (user)
            req.user = user;
    }
    next();
}
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user)
            return next(error_1.ApiError.unauthorized());
        if (!roles.includes(req.user.role))
            return next(error_1.ApiError.forbidden());
        next();
    };
}
function requireVerified(req, _res, next) {
    if (!req.user)
        return next(error_1.ApiError.unauthorized());
    if (!req.user.emailVerified)
        return next(error_1.ApiError.forbidden('Email verification required for this action'));
    next();
}
//# sourceMappingURL=auth.js.map