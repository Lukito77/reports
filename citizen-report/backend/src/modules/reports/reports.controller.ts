import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../../middleware/error';
import * as service from './reports.service';

export async function createReport(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const report = await service.createReport(
    req.body,
    files.map((f) => ({ buffer: f.buffer, mimetype: f.mimetype, size: f.size })),
    {
      userId: req.user?.id,
      emailVerified: req.user?.emailVerified,
      ip: req.ip,
      userAgent: req.headers['user-agent']?.toString(),
    },
  );
  res.status(201).json({ report, message: 'Report submitted for review. Thank you.' });
}

export async function listCategories(_req: Request, res: Response) {
  res.json({ categories: await service.listCategories() });
}

export async function listMyReports(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { status, page, pageSize } = req.query as unknown as {
    status?: never;
    page: number;
    pageSize: number;
  };
  res.json(await service.listMyReports(req.user.id, { status, page, pageSize }));
}

export async function getReport(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const report = await service.getReport(req.params.id, {
    id: req.user.id,
    role: req.user.role as Role,
  });
  res.json({ report });
}
