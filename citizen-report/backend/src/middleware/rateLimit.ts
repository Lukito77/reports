/**
 * Rate limiters. Uses the default in-memory store (fine for a single instance /
 * dev). For multi-instance production, back it with Redis (see DEPLOYMENT.md).
 */
import rateLimit from 'express-rate-limit';

const message = {
  error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
};

// Generous global limiter.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

// Strict limiter for auth endpoints (brute-force / credential stuffing).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

// Limiter for report submission (spam control).
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});
