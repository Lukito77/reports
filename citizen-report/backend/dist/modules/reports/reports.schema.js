"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportIdSchema = exports.listMyReportsSchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../models/enums");
// Multipart fields arrive as strings; coerce/validate explicitly.
exports.createReportSchema = zod_1.z.object({
    categorySlug: zod_1.z.string().min(1).max(60),
    description: zod_1.z.string().min(10, 'Please describe the issue').max(5000),
    latitude: zod_1.z.coerce.number().min(-90).max(90).optional(),
    longitude: zod_1.z.coerce.number().min(-180).max(180).optional(),
    address: zod_1.z.string().max(300).optional(),
    incidentAt: zod_1.z.coerce.date().optional(),
    anonymous: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.string()])
        .transform((v) => v === true || v === 'true')
        .default(false),
    contact: zod_1.z.string().max(200).optional(), // encrypted at rest if provided
    consentGiven: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.string()])
        .transform((v) => v === true || v === 'true'),
    consentText: zod_1.z.string().max(4000).optional(),
    policyVersion: zod_1.z.string().max(40).default('1.0'),
    captchaToken: zod_1.z.string().optional(),
});
exports.listMyReportsSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(enums_1.ReportStatus).optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.reportIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
//# sourceMappingURL=reports.schema.js.map