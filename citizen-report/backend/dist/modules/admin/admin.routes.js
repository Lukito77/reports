"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enums_1 = require("../../models/enums");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const admin_schema_1 = require("./admin.schema");
const reports_schema_1 = require("../reports/reports.schema");
const ctrl = __importStar(require("./admin.controller"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// All admin routes require authentication + staff role.
router.use(auth_1.requireAuth, (0, auth_1.requireRole)(enums_1.Role.ADMIN, enums_1.Role.MODERATOR));
/**
 * @openapi
 * /admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: List & filter all reports (status, category, location, date, text)
 */
router.get('/reports', (0, validate_1.validate)({ query: admin_schema_1.listReportsSchema }), ctrl.listReports);
/**
 * @openapi
 * /admin/reports/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: View a report's full evidence (audited as EVIDENCE_VIEWED)
 */
router.get('/reports/:id', (0, validate_1.validate)({ params: reports_schema_1.reportIdSchema }), ctrl.getReport);
/**
 * @openapi
 * /admin/reports/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve / reject / request-info / close a report (audited)
 *     description: Approval only forwards for a human enforcement decision; no automatic penalty.
 */
router.patch('/reports/:id/status', (0, validate_1.validate)({ params: reports_schema_1.reportIdSchema, body: admin_schema_1.updateStatusSchema }), ctrl.updateStatus);
/**
 * @openapi
 * /admin/audit:
 *   get:
 *     tags: [Admin]
 *     summary: Read the append-only audit log
 */
router.get('/audit', (0, validate_1.validate)({ query: admin_schema_1.auditQuerySchema }), ctrl.listAuditLogs);
/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Aggregate report counts by status
 */
router.get('/stats', ctrl.stats);
// Role management is ADMIN-only.
router.patch('/users/:userId/role', (0, auth_1.requireRole)(enums_1.Role.ADMIN), (0, validate_1.validate)({ params: zod_1.z.object({ userId: zod_1.z.string().uuid() }), body: admin_schema_1.changeRoleSchema }), ctrl.changeUserRole);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map