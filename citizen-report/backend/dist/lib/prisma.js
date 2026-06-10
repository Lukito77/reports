"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
/**
 * Single shared Prisma client. In dev we reuse the instance across hot reloads
 * to avoid exhausting database connections.
 */
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: env_1.isProd ? ['error', 'warn'] : ['error', 'warn', 'query'],
    });
if (!env_1.isProd)
    globalForPrisma.prisma = exports.prisma;
//# sourceMappingURL=prisma.js.map