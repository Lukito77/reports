import { Request, Response } from 'express';
import { ReportStatus, AuditAction } from '../../models/enums';
import { ApiError } from '../../middleware/error';
import { recordAudit } from '../../lib/audit';
import * as service from './admin.service';
import * as reportService from '../reports/reports.service';

export async function listReports(req: Request, res: Response) {
  res.json(await service.listReports(req.query as never));
}

export async function getReport(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  // Reuse the shared getter (returns originals + decrypted plate for staff).
  const report = await reportService.getReport(req.params.id, {
    id: req.user.id,
    role: req.user.role,
  });
  await recordAudit({
    action: AuditAction.EVIDENCE_VIEWED,
    actorId: req.user.id,
    reportId: req.params.id,
    req,
  });
  res.json({ report });
}

export async function updateStatus(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const report = await service.updateStatus(
    req.params.id,
    req.body.status as ReportStatus,
    req.body.note,
    req.user.id,
    req,
  );
  res.json({ report });
}

export async function changeUserRole(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const user = await service.changeUserRole(req.params.userId, req.body.role, req.user.id, req);
  res.json({ user });
}

export async function listAuditLogs(req: Request, res: Response) {
  res.json(await service.listAuditLogs(req.query as never));
}

export async function stats(_req: Request, res: Response) {
  res.json(await service.stats());
}
