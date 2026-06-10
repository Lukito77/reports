"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("../config/env");
/**
 * Structured logger. Never log secrets or PII. Redaction below covers the most
 * common accidental leaks (auth headers, cookies, passwords, tokens).
 */
exports.logger = (0, pino_1.default)({
    level: env_1.isProd ? 'info' : 'debug',
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'password',
            'passwordHash',
            '*.password',
            '*.token',
            '*.refreshToken',
        ],
        censor: '[redacted]',
    },
    transport: env_1.isProd
        ? undefined
        : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
});
//# sourceMappingURL=logger.js.map