/**
 * Admin domain logic: filtered report listing, status transitions (state
 * machine), role management, and audit-log access. Every mutating action is
 * audited. NOTE: changing a report to APPROVED only forwards it for a human
 * enforcement decision — it never issues a penalty automatically.
 */
import { Prisma, ReportStatus, Role, AuditAction } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../middleware/error';
import { recordAudit } from '../../lib/audit';
import type { Request } from 'express';

// Allowed transitions. SUBMITTED can go to review/info/approve/reject; etc.
const TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED'],
  UNDER_REVIEW: ['INFO_REQUESTED', 'APPROVED', 'REJECTED', 'CLOSED'],
  INFO_REQUESTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'],
  APPROVED: ['CLOSED'],
  REJECTED: ['CLOSED'],
  CLOSED: [],
};

const ACTION_FOR_STATUS: Record<string, AuditAction> = {
  APPROVED: AuditAction.REPORT_APPROVED,
  REJECTED: AuditAction.REPORT_REJECTED,
  INFO_REQUESTED: AuditAction.INFO_REQUESTED,
  CLOSED: AuditAction.REPORT_CLOSED,
  UNDER_REVIEW: AuditAction.STATUS_CHANGED,
};

interface ListFilters {
  status?: ReportStatus;
  categorySlug?: string;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  from?: Date;
  to?: Date;
  q?: string;
  page: number;
  pageSize: number;
}

export async function listReports(f: ListFilters) {
  const where: Prisma.ReportWhereInput = {};
  if (f.status) where.status = f.status;
  if (f.categorySlug) where.category = { slug: f.categorySlug };
  if (f.from || f.to) where.createdAt = { gte: f.from, lte: f.to };
  if (f.minLat != null || f.maxLat != null) where.latitude = { gte: f.minLat, lte: f.maxLat };
  if (f.minLng != null || f.maxLng != null) where.longitude = { gte: f.minLng, lte: f.maxLng };
  if (f.q) where.description = { contains: f.q, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
      include: {
        category: true,
        reporter: { select: { id: true, email: true, displayName: true } },
        media: { select: { id: true, kind: true } },
        _count: { select: { media: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  // Never leak encrypted contact in list view.
  const sanitized = items.map(({ contactEnc, ...r }) => r);
  return { items: sanitized, total, page: f.page, pageSize: f.pageSize };
}

export async function updateStatus(
  reportId: string,
  next: ReportStatus,
  note: string | undefined,
  actorId: string,
  req: Request,
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw ApiError.notFound('Report not found');

  const allowed = TRANSITIONS[report.status];
  if (!allowed.includes(next)) {
    throw ApiError.badRequest(`Cannot change status from ${report.status} to ${next}`);
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: next,
      reviewerNote: next === ReportStatus.INFO_REQUESTED ? note ?? report.reviewerNote : report.reviewerNote,
    },
    include: { category: true },
  });

  await recordAudit({
    action: ACTION_FOR_STATUS[next] ?? AuditAction.STATUS_CHANGED,
    actorId,
    reportId,
    metadata: { from: report.status, to: next, note: note ?? null },
    req,
  });

  const { contactEnc, ...safe } = updated;
  void contactEnc;
  return safe;
}

export async function changeUserRole(targetUserId: string, role: Role, actorId: string, req: Request) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw ApiError.notFound('User not found');

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    // Bumping tokenVersion forces re-auth with the new role.
    data: { role, tokenVersion: { increment: 1 } },
    select: { id: true, email: true, role: true },
  });

  await recordAudit({
    action: AuditAction.USER_ROLE_CHANGED,
    actorId,
    metadata: { targetUserId, from: user.role, to: role },
    req,
  });
  return updated;
}

export async function listAuditLogs(opts: {
  reportId?: string;
  actorId?: string;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.AuditLogWhereInput = {};
  if (opts.reportId) where.reportId = opts.reportId;
  if (opts.actorId) where.actorId = opts.actorId;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      include: { actor: { select: { id: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page: opts.page, pageSize: opts.pageSize };
}

export async function stats() {
  const byStatus = await prisma.report.groupBy({ by: ['status'], _count: true });
  const total = await prisma.report.count();
  return {
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
  };
}
