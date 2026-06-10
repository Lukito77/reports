/**
 * Express application wiring: security middleware, parsers, routes, docs, and
 * the centralized error handler.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { logger } from './lib/logger';
import { mongoose } from './lib/mongoose';
import { globalLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/error';
import { openapiSpec } from './docs/openapi';

import authRoutes from './modules/auth/auth.routes';
import reportRoutes from './modules/reports/reports.routes';
import adminRoutes from './modules/admin/admin.routes';
import userRoutes from './modules/users/users.routes';
import aiRoutes from './modules/ai/ai.routes';

export function createApp() {
  const app = express();

  // Behind a reverse proxy (TLS, real client IP for rate limiting).
  app.set('trust proxy', 1);

  // Security headers (CSP, HSTS, no-sniff, frameguard, etc.).
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));
  app.use(globalLimiter);

  // Health / readiness.
  app.get('/api/health', async (_req, res) => {
    try {
      const db = mongoose.connection.db;
      if (mongoose.connection.readyState !== 1 || !db) throw new Error('not connected');
      await db.admin().ping();
      res.json({ status: 'ok', time: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'degraded', reason: 'database unavailable' });
    }
  });

  // API docs.
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.get('/api/openapi.json', (_req, res) => res.json(openapiSpec));

  // Feature routes.
  app.use('/api/auth', authRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ai', aiRoutes);

  // 404 + error handlers (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
