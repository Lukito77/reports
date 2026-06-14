/**
 * Admin domain logic: filtered report listing, status transitions (state
 * machine), role management, and audit-log access. Every mutating action is
 * audited. NOTE: changing a report to APPROVED only forwards it for a human
 * enforcement decision — it never issues a penalty automatically.
 */
import type { FilterQuery } from 'mongoose';
import {
  ReportStatus,
  Role,
  AuditAction,
  Report,
  Category,
  MediaAsset,
  User,
  AuditLog,
  type IReport,
  type IAuditLog,
} from '../../models';
import { ApiError } from '../../middleware/error';
import { recordAudit } from '../../lib/audit';
import { hardDeleteReport } from '../reports/reports.service';
import type { Request } from 'express';

// Allowed transitions. SUBMITTED can go to review/info/approve/reject; etc.
const TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED'] as ReportStatus[],
  UNDER_REVIEW: ['INFO_REQUESTED', 'APPROVED', 'REJECTED', 'CLOSED'] as ReportStatus[],
  INFO_REQUESTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'] as ReportStatus[],
  APPROVED: ['CLOSED'] as ReportStatus[],
  REJECTED: ['CLOSED'] as ReportStatus[],
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
  const where: Record<string, unknown> = {};
  if (f.status) where.status = f.status;
  if (f.categorySlug) {
    // Category is a separate collection; resolve slug -> id first.
    const category = await Category.findOne({ slug: f.categorySlug }).select('_id');
    // No match -> ensure an empty result set rather than ignoring the filter.
    where.categoryId = category ? category.id : '__no_such_category__';
  }
  if (f.from || f.to) {
    const range: Record<string, Date> = {};
    if (f.from) range.$gte = f.from;
    if (f.to) range.$lte = f.to;
    where.createdAt = range;
  }
  if (f.minLat != null || f.maxLat != null) {
    const range: Record<string, number> = {};
    if (f.minLat != null) range.$gte = f.minLat;
    if (f.maxLat != null) range.$lte = f.maxLat;
    where.latitude = range;
  }
  if (f.minLng != null || f.maxLng != null) {
    const range: Record<string, number> = {};
    if (f.minLng != null) range.$gte = f.minLng;
    if (f.maxLng != null) range.$lte = f.maxLng;
    where.longitude = range;
  }
  if (f.q) {
    // Case-insensitive substring match (was Prisma `contains` + `mode: insensitive`).
    where.description = { $regex: escapeRegex(f.q), $options: 'i' };
  }

  const filter = where as FilterQuery<IReport>;
  const [docs, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((f.page - 1) * f.pageSize)
      .limit(f.pageSize)
      .populate('category')
      .populate({ path: 'reporter', select: 'email displayName' }),
    Report.countDocuments(filter),
  ]);

  // Attach media summaries + counts (was `include.media` + `_count.media`).
  const media = await MediaAsset.find({ reportId: { $in: docs.map((d) => d.id) } }).select(
    'reportId kind',
  );
  const mediaByReport = new Map<string, { id: string; kind: string }[]>();
  for (const m of media) {
    const list = mediaByReport.get(m.reportId) ?? [];
    list.push({ id: m.id, kind: m.kind });
    mediaByReport.set(m.reportId, list);
  }

  // Never leak encrypted contact in list view.
  const items = docs.map((d) => {
    const { contactEnc, ...r } = d.toObject() as unknown as Record<string, unknown>;
    void contactEnc;
    const mediaList = mediaByReport.get(d.id) ?? [];
    return { ...r, media: mediaList, _count: { media: mediaList.length } };
  });
  return { items, total, page: f.page, pageSize: f.pageSize };
}

export async function updateStatus(
  reportId: string,
  next: ReportStatus,
  note: string | undefined,
  actorId: string,
  req: Request,
) {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found');

  const allowed = TRANSITIONS[report.status];
  if (!allowed.includes(next)) {
    throw ApiError.badRequest(`Cannot change status from ${report.status} to ${next}`);
  }

  const updated = await Report.findByIdAndUpdate(
    reportId,
    {
      status: next,
      reviewerNote:
        next === ReportStatus.INFO_REQUESTED ? note ?? report.reviewerNote : report.reviewerNote,
    },
    { new: true },
  ).populate('category');

  await recordAudit({
    action: ACTION_FOR_STATUS[next] ?? AuditAction.STATUS_CHANGED,
    actorId,
    reportId,
    metadata: { from: report.status, to: next, note: note ?? null },
    req,
  });

  const { contactEnc, ...safe } = (updated as NonNullable<typeof updated>).toObject() as unknown as Record<
    string,
    unknown
  >;
  void contactEnc;
  return safe;
}

/**
 * Permanently delete a report plus its media objects and dependent records.
 * Audited before the row disappears so the action stays in the append-only log.
 */
export async function deleteReport(reportId: string, actorId: string, req: Request) {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found');

  await recordAudit({
    action: AuditAction.REPORT_DELETED,
    actorId,
    reportId,
    metadata: { status: report.status },
    req,
  });

  await hardDeleteReport(reportId);
}

export async function changeUserRole(targetUserId: string, role: Role, actorId: string, req: Request) {
  const user = await User.findById(targetUserId);
  if (!user) throw ApiError.notFound('User not found');

  // Bumping tokenVersion forces re-auth with the new role.
  const updated = await User.findByIdAndUpdate(
    targetUserId,
    { role, $inc: { tokenVersion: 1 } },
    { new: true },
  ).select('email role');

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
  const where: FilterQuery<IAuditLog> = {};
  if (opts.reportId) where.reportId = opts.reportId;
  if (opts.actorId) where.actorId = opts.actorId;

  const [items, total] = await Promise.all([
    AuditLog.find(where)
      .sort({ createdAt: -1 })
      .skip((opts.page - 1) * opts.pageSize)
      .limit(opts.pageSize)
      .populate({ path: 'actor', select: 'email role' }),
    AuditLog.countDocuments(where),
  ]);
  return { items, total, page: opts.page, pageSize: opts.pageSize };
}

export async function stats() {
  const byStatusRows = await Report.aggregate<{ _id: ReportStatus; count: number }>([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const total = await Report.countDocuments();
  return {
    total,
    byStatus: Object.fromEntries(byStatusRows.map((s) => [s._id, s.count])),
  };
}

/** Escape user input before embedding it in a regular expression. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
