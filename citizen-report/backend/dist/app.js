"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
/**
 * Express application wiring: security middleware, parsers, routes, docs, and
 * the centralized error handler.
 */
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const pino_http_1 = __importDefault(require("pino-http"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const mongoose_1 = require("./lib/mongoose");
const rateLimit_1 = require("./middleware/rateLimit");
const error_1 = require("./middleware/error");
const openapi_1 = require("./docs/openapi");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
function createApp() {
    const app = (0, express_1.default)();
    // Behind a reverse proxy (TLS, real client IP for rate limiting).
    app.set('trust proxy', 1);
    // Security headers (CSP, HSTS, no-sniff, frameguard, etc.).
    app.use((0, helmet_1.default)({
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
    }));
    app.use((0, cors_1.default)({
        origin: env_1.env.CORS_ORIGIN.split(',').map((o) => o.trim()),
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, pino_http_1.default)({ logger: logger_1.logger }));
    app.use(rateLimit_1.globalLimiter);
    // Health / readiness.
    app.get('/api/health', async (_req, res) => {
        try {
            const db = mongoose_1.mongoose.connection.db;
            if (mongoose_1.mongoose.connection.readyState !== 1 || !db)
                throw new Error('not connected');
            await db.admin().ping();
            res.json({ status: 'ok', time: new Date().toISOString() });
        }
        catch {
            res.status(503).json({ status: 'degraded', reason: 'database unavailable' });
        }
    });
    // API docs.
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_1.openapiSpec));
    app.get('/api/openapi.json', (_req, res) => res.json(openapi_1.openapiSpec));
    // Feature routes.
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/reports', reports_routes_1.default);
    app.use('/api/users', users_routes_1.default);
    app.use('/api/admin', admin_routes_1.default);
    app.use('/api/ai', ai_routes_1.default);
    // 404 + error handlers (must be last).
    app.use(error_1.notFoundHandler);
    app.use(error_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map