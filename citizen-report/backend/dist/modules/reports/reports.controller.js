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
exports.createReport = createReport;
exports.listCategories = listCategories;
exports.listMyReports = listMyReports;
exports.getReport = getReport;
const error_1 = require("../../middleware/error");
const service = __importStar(require("./reports.service"));
async function createReport(req, res) {
    const files = req.files ?? [];
    const report = await service.createReport(req.body, files.map((f) => ({ buffer: f.buffer, mimetype: f.mimetype, size: f.size })), {
        userId: req.user?.id,
        emailVerified: req.user?.emailVerified,
        ip: req.ip,
        userAgent: req.headers['user-agent']?.toString(),
    });
    res.status(201).json({ report, message: 'Report submitted for review. Thank you.' });
}
async function listCategories(_req, res) {
    res.json({ categories: await service.listCategories() });
}
async function listMyReports(req, res) {
    if (!req.user)
        throw error_1.ApiError.unauthorized();
    const { status, page, pageSize } = req.query;
    res.json(await service.listMyReports(req.user.id, { status, page, pageSize }));
}
async function getReport(req, res) {
    if (!req.user)
        throw error_1.ApiError.unauthorized();
    const report = await service.getReport(req.params.id, {
        id: req.user.id,
        role: req.user.role,
    });
    res.json({ report });
}
//# sourceMappingURL=reports.controller.js.map