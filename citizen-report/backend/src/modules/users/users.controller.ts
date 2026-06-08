import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../middleware/error';
import { recordAudit } from '../../lib/audit';
import { AuditAction } from '@prisma/client';

/** Current user's profile. */
export async function me(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  res.json({ user });
}

/**
 * GDPR data export: returns all personal data we hold for the user, including
 * their reports (metadata only — media is downloadable via the report endpoints).
 */
export async function exportData(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });
  const reports = await prisma.report.findMany({
    where: { reporterId: req.user.id },
    include: { category: { select: { slug: true, name: true } }, media: { select: { id: true, kind: true, mimeType: true, createdAt: true } } },
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

  await prisma.$transaction([
    // Detach reports from the person; mark anonymous and clear encrypted contact.
    prisma.report.updateMany({
      where: { reporterId: userId },
      data: { reporterId: null, anonymous: true, contactEnc: null },
    }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);

  await recordAudit({ action: AuditAction.DATA_ERASED, actorId: null, metadata: { erasedUserId: userId }, req });
  await prisma.user.delete({ where: { id: userId } });

  res.clearCookie('crp_refresh', { path: '/api/auth' });
  res.json({ message: 'Account erased. Your reports have been anonymized.' });
}
