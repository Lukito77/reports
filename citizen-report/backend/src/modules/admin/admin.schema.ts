import { z } from 'zod';
import { ReportStatus, Role, ContentType, ALL_PERMISSIONS } from '../../models/enums';

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

// ── Control-panel schemas ────────────────────────────────────────────────

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color like #1d4ed8');

const themeSchema = z
  .object({
    brand50: hexColor,
    brand100: hexColor,
    brand500: hexColor,
    brand600: hexColor,
    brand700: hexColor,
    background: hexColor,
    foreground: hexColor,
    accent: hexColor,
    fontFamily: z.string().min(1).max(300),
    fontSizeBase: z.number().int().min(12).max(22),
    radius: z.number().int().min(0).max(32),
  })
  .partial();

const brandingSchema = z
  .object({
    siteName: z.string().min(1).max(80),
    logoEmoji: z.string().max(8),
    tagline: z.string().max(200),
  })
  .partial();

const layoutSchema = z
  .object({
    containerWidth: z.enum(['narrow', 'normal', 'wide', 'full']),
    showFooter: z.boolean(),
    showLanguageSwitcher: z.boolean(),
    showReportButton: z.boolean(),
  })
  .partial();

export const updateSettingsSchema = z
  .object({
    theme: themeSchema,
    branding: brandingSchema,
    layout: layoutSchema,
  })
  .partial();

export const contentCreateSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Key may contain letters, numbers, dot, dash, underscore'),
  group: z.string().min(1).max(60),
  label: z.string().max(160).optional().default(''),
  type: z.nativeEnum(ContentType).optional().default(ContentType.TEXT),
  valueKa: z.string().max(20000).optional().default(''),
  valueEn: z.string().max(20000).optional().default(''),
  order: z.coerce.number().int().optional().default(0),
});

export const contentUpdateSchema = z.object({
  group: z.string().min(1).max(60).optional(),
  label: z.string().max(160).optional(),
  type: z.nativeEnum(ContentType).optional(),
  valueKa: z.string().max(20000).optional(),
  valueEn: z.string().max(20000).optional(),
  order: z.coerce.number().int().optional(),
});

export const updatePermissionsSchema = z.object({
  permissions: z
    .array(z.string())
    .refine((arr) => arr.every((p) => (ALL_PERMISSIONS as string[]).includes(p)), {
      message: 'Unknown permission',
    }),
});

export const listUsersSchema = z.object({
  q: z.string().max(200).optional(),
  role: z.nativeEnum(Role).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

export const collectionListSchema = z.object({
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().max(60).optional(),
});
