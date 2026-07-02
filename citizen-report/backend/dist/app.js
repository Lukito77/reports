"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("./config/passport"));
const logger_1 = require("./lib/logger");
const mongoose_1 = require("./lib/mongoose");
const rateLimit_1 = require("./middleware/rateLimit");
const error_1 = require("./middleware/error");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const public_routes_1 = __importDefault(require("./modules/public/public.routes"));
require("./config/passport");
const connectToDatabase = async () => {
    if (mongoose_1.mongoose.connection.readyState >= 1)
        return;
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        logger_1.logger.error('Database connection string is missing');
        return;
    }
    try {
        await mongoose_1.mongoose.connect(uri, { bufferCommands: false });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Database connection failed');
    }
};
function createApp() {
    const app = (0, express_1.default)();
    app.set('trust proxy', 1);
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
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use((0, cors_1.default)({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    app.use(rateLimit_1.globalLimiter);
    // აქ ვუწერთ "as any"-ს, რომ TypeScript-ის ტიპების ერორი გაქრეს
    app.use(passport_1.default.initialize());
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/reports', reports_routes_1.default);
    app.use('/api/admin', admin_routes_1.default);
    app.use('/api/users', users_routes_1.default);
    app.use('/api', public_routes_1.default);
    app.use(error_1.notFoundHandler);
    app.use(error_1.errorHandler);
    return { app, connectToDatabase };
}
//# sourceMappingURL=app.js.map