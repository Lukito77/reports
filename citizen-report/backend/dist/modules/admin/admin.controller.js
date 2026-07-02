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
exports.listReports = listReports;
exports.getReport = getReport;
exports.updateStatus = updateStatus;
exports.deleteReport = deleteReport;
exports.changeUserRole = changeUserRole;
exports.listAuditLogs = listAuditLogs;
exports.stats = stats;
const enums_1 = require("../../models/enums");
const error_1 = require("../../middleware/error");
const audit_1 = require("../../lib/audit");
const service = __importStar(require("./admin.service"));
const reportService = __importStar(require("../reports/reports.service"));
async function listReports(req, res) {
    res.json(await service.listReports(req.query));
}
async function getReport(req, res) {
    if (!req.user)
        throw error_1.ApiError.unauthorized();
    // Reuse the shared getter (returns originals + decrypted plate for staff).
    const report = await reportService.getReport(req.params.id, {
        id: req.user.id,
        role: req.user.role,
    });
    await (0, audit_1.recordAudit)({
        action: enums_1.AuditAction.EVIDENCE_VIEWED,
        actorId: req.user.id,
        reportId: req.params.id,
        req,
    });
    res.json({ report });
}
async function updateStatus(req, res) {
    if (!req.user)
        throw error_1.ApiError.unauthorized();
    const report = await service.updateStatus(req.params.id, req.body.status, req.body.note, req.user.id, req);
    res.json({ report });
}
async function deleteReport(req, res) {
    if (!req.user)
        throw error_1.ApiError.unauthorized();
    await service.deleteReport(req.params.id, req.user.id, req);
    res.status(204).send();
}
async function changeUserRole(req, res) {
    if (!req.user)
        throw error_1.ApiError.unauthorized();
    const user = await service.changeUserRole(req.params.userId, req.body.role, req.user.id, req);
    res.json({ user });
}
async function listAuditLogs(req, res) {
    res.json(await service.listAuditLogs(req.query));
}
async function stats(_req, res) {
    res.json(await service.stats());
}
//# sourceMappingURL=admin.controller.js.map