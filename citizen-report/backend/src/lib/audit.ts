/**
 * Append-only audit logging for administrative and privacy-sensitive actions.
 * The AuditLog collection is never updated or deleted in normal operation.
 */
import { Request } from 'express';
import { AuditAction, AuditLog } from '../models';
import { logger } from './logger';

interface AuditInput {
  action: AuditAction;
  actorId?: string | null;
  reportId?: string | null;
  metadata?: Record<string, unknown>;
  req?: Request;
}

export async function recordAudit({ action, actorId, reportId, metadata, req }: AuditInput) {
  try {
    await AuditLog.create({
      action,
      actorId: actorId ?? null,
      reportId: reportId ?? null,
      metadata: metadata ?? null,
      ip: req?.ip,
      userAgent: req?.headers['user-agent']?.toString().slice(0, 512),
    });
  } catch (err) {
    // Auditing must never break the request, but failures must be visible.
    logger.error({ err, action }, 'Failed to write audit log');
  }
}
