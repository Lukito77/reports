/**
 * Append-only audit logging for administrative and privacy-sensitive actions.
 * The AuditLog table is never updated or deleted in normal operation.
 */
import { AuditAction, Prisma } from '@prisma/client';
import { Request } from 'express';
import { prisma } from './prisma';
import { logger } from './logger';

interface AuditInput {
  action: AuditAction;
  actorId?: string | null;
  reportId?: string | null;
  metadata?: Prisma.InputJsonValue;
  req?: Request;
}

export async function recordAudit({ action, actorId, reportId, metadata, req }: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorId: actorId ?? null,
        reportId: reportId ?? null,
        metadata: metadata ?? undefined,
        ip: req?.ip,
        userAgent: req?.headers['user-agent']?.toString().slice(0, 512),
      },
    });
  } catch (err) {
    // Auditing must never break the request, but failures must be visible.
    logger.error({ err, action }, 'Failed to write audit log');
  }
}
