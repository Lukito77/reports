"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportLimiter = exports.authLimiter = exports.globalLimiter = void 0;
/**
 * Rate limiters. Uses the default in-memory store (fine for a single instance /
 * dev). For multi-instance production, back it with Redis (see DEPLOYMENT.md).
 */
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const message = {
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
};
// Generous global limiter.
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message,
});
// Strict limiter for auth endpoints (brute-force / credential stuffing).
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message,
});
// Limiter for report submission (spam control).
exports.reportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message,
});
//# sourceMappingURL=rateLimit.js.map