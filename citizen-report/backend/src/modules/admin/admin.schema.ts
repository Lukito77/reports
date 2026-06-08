import { z } from 'zod';
import { ReportStatus, Role } from '@prisma/client';

export const listReportsSchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
  categorySlug: z.string().max(60).optional(),
  // Bounding box filter for location.
  minLat: z.coerce.number().min(-90).max(90).optional(),
  maxLat: z.coerce.number().min(-90).max(90).optional(),
  minLng: z.coerce.number().min(-180).max(180).optional(),
  maxLng: z.coerce.number().min(-180).max(180).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().max(200).optional(), // free-text search in description
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Allowed status transitions (server-enforced state machine).
export const updateStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'CLOSED']),
  note: z.string().max(2000).optional(),
});

export const changeRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export const auditQuerySchema = z.object({
  reportId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
