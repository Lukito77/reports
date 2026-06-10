"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditQuerySchema = exports.changeRoleSchema = exports.updateStatusSchema = exports.listReportsSchema = void 0;
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
//# sourceMappingURL=admin.schema.js.map