import { Request, Response } from 'express';
import { ApiError } from '../../middleware/error';
import { recordAudit } from '../../lib/audit';
import { AuditAction, User, Report, RefreshToken, MediaAsset } from '../../models';

/** Current user's profile. */
export async function me(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user.id).select(
    'email displayName role emailVerified createdAt',
  );
  res.json({ user });
}

/**
 * GDPR data export: returns all personal data we hold for the user, including
 * their reports (metadata only — media is downloadable via the report endpoints).
 */
export async function exportData(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user.id).select('email displayName role createdAt');

  const reportDocs = await Report.find({ reporterId: req.user.id }).populate({
    path: 'category',
    select: '-_id slug name',
  });
  const media = await MediaAsset.find({ reportId: { $in: reportDocs.map((r) => r.id) } }).select(
    'reportId kind mimeType createdAt',
  );
  const mediaByReport = new Map<string, Record<string, unknown>[]>();
  for (const m of media) {
    const list = mediaByReport.get(m.reportId) ?? [];
    list.push({ id: m.id, kind: m.kind, mimeType: m.mimeType, createdAt: m.createdAt });
    mediaByReport.set(m.reportId, list);
  }
  const reports = reportDocs.map((r) => {
    const obj = r.toObject() as unknown as Record<string, unknown>;
    obj.media = mediaByReport.get(r.id) ?? [];
    return obj;
  });

  await recordAudit({ action: AuditAction.DATA_EXPORTED, actorId: req.user.id, req });
  res.setHeader('Content-Disposition', 'attachment; filename="citizen-report-export.json"');
  res.json({ exportedAt: new Date().toISOString(), user, reports });
}

/**
 * GDPR erasure: anonymizes the user's reports (keeps them for the public-interest
 * record but severs the link to the person) and deletes the account.
 */
export async function eraseAccount(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const userId = req.user.id;

  // Detach reports from the person; mark anonymous and clear encrypted contact.
  await Report.updateMany(
    { reporterId: userId },
    { reporterId: null, anonymous: true, contactEnc: null },
  );
  await RefreshToken.deleteMany({ userId });

  await recordAudit({ action: AuditAction.DATA_ERASED, actorId: null, metadata: { erasedUserId: userId }, req });
  await User.deleteOne({ _id: userId });

  res.clearCookie('crp_refresh', { path: '/api/auth' });
  res.json({ message: 'Account erased. Your reports have been anonymized.' });
}
