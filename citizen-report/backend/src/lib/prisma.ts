import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env';

/**
 * Single shared Prisma client. In dev we reuse the instance across hot reloads
 * to avoid exhausting database connections.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['error', 'warn', 'query'],
  });

if (!isProd) globalForPrisma.prisma = prisma;
