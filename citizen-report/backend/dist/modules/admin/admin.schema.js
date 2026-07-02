"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionListSchema = exports.analyticsQuerySchema = exports.listUsersSchema = exports.updatePermissionsSchema = exports.contentUpdateSchema = exports.contentCreateSchema = exports.updateSettingsSchema = exports.auditQuerySchema = exports.changeRoleSchema = exports.updateStatusSchema = exports.listReportsSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../models/enums");
exports.listReportsSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(enums_1.ReportStatus).optional(),
    categorySlug: zod_1.z.string().max(60).optional(),
    // Bounding box filter for location.
    minLat: zod_1.z.coerce.number().min(-90).max(90).optional(),
    maxLat: zod_1.z.coerce.number().min(-90).max(90).optional(),
    minLng: zod_1.z.coerce.number().min(-180).max(180).optional(),
    maxLng: zod_1.z.coerce.number().min(-180).max(180).optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    q: zod_1.z.string().max(200).optional(), // free-text search in description
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
// Allowed status transitions (server-enforced state machine).
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['UNDER_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'CLOSED']),
    note: zod_1.z.string().max(2000).optional(),
});
exports.changeRoleSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(enums_1.Role),
});
exports.auditQuerySchema = zod_1.z.object({
    reportId: zod_1.z.string().uuid().optional(),
    actorId: zod_1.z.string().uuid().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(200).default(50),
});
// ── Control-panel schemas ────────────────────────────────────────────────
const hexColor = zod_1.z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color like #1d4ed8');
const themeSchema = zod_1.z
    .object({
    brand50: hexColor,
    brand100: hexColor,
    brand500: hexColor,
    brand600: hexColor,
    brand700: hexColor,
    background: hexColor,
    foreground: hexColor,
    accent: hexColor,
    fontFamily: zod_1.z.string().min(1).max(300),
    fontSizeBase: zod_1.z.number().int().min(12).max(22),
    radius: zod_1.z.number().int().min(0).max(32),
})
    .partial();
const brandingSchema = zod_1.z
    .object({
    siteName: zod_1.z.string().min(1).max(80),
    logoEmoji: zod_1.z.string().max(8),
    tagline: zod_1.z.string().max(200),
})
    .partial();
const layoutSchema = zod_1.z
    .object({
    containerWidth: zod_1.z.enum(['narrow', 'normal', 'wide', 'full']),
    showFooter: zod_1.z.boolean(),
    showLanguageSwitcher: zod_1.z.boolean(),
    showReportButton: zod_1.z.boolean(),
})
    .partial();
exports.updateSettingsSchema = zod_1.z
    .object({
    theme: themeSchema,
    branding: brandingSchema,
    layout: layoutSchema,
})
    .partial();
exports.contentCreateSchema = zod_1.z.object({
    key: zod_1.z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-zA-Z0-9_.-]+$/, 'Key may contain letters, numbers, dot, dash, underscore'),
    group: zod_1.z.string().min(1).max(60),
    label: zod_1.z.string().max(160).optional().default(''),
    type: zod_1.z.nativeEnum(enums_1.ContentType).optional().default(enums_1.ContentType.TEXT),
    valueKa: zod_1.z.string().max(20000).optional().default(''),
    valueEn: zod_1.z.string().max(20000).optional().default(''),
    order: zod_1.z.coerce.number().int().optional().default(0),
});
exports.contentUpdateSchema = zod_1.z.object({
    group: zod_1.z.string().min(1).max(60).optional(),
    label: zod_1.z.string().max(160).optional(),
    type: zod_1.z.nativeEnum(enums_1.ContentType).optional(),
    valueKa: zod_1.z.string().max(20000).optional(),
    valueEn: zod_1.z.string().max(20000).optional(),
    order: zod_1.z.coerce.number().int().optional(),
});
exports.updatePermissionsSchema = zod_1.z.object({
    permissions: zod_1.z
        .array(zod_1.z.string())
        .refine((arr) => arr.every((p) => enums_1.ALL_PERMISSIONS.includes(p)), {
        message: 'Unknown permission',
    }),
});
exports.listUsersSchema = zod_1.z.object({
    q: zod_1.z.string().max(200).optional(),
    role: zod_1.z.nativeEnum(enums_1.Role).optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(25),
});
exports.analyticsQuerySchema = zod_1.z.object({
    days: zod_1.z.coerce.number().int().min(7).max(365).default(30),
});
exports.collectionListSchema = zod_1.z.object({
    q: zod_1.z.string().max(200).optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    sort: zod_1.z.string().max(60).optional(),
});
//# sourceMappingURL=admin.schema.js.map