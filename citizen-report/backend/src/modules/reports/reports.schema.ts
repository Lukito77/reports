import { z } from 'zod';
import { ReportStatus } from '../../models/enums';

// Multipart fields arrive as strings; coerce/validate explicitly.
export const createReportSchema = z.object({
  categorySlug: z.string().min(1).max(60),
  description: z.string().min(10, 'Please describe the issue').max(5000),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  address: z.string().max(300).optional(),
  incidentAt: z.coerce.date().optional(),
  anonymous: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'true')
    .default(false),
  contact: z.string().max(200).optional(), // encrypted at rest if provided
  consentGiven: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'true'),
  consentText: z.string().max(4000).optional(),
  policyVersion: z.string().max(40).default('1.0'),
  captchaToken: z.string().optional(),
});

export const listMyReportsSchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const reportIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
