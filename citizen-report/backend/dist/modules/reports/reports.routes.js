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
const upload_1 = require("../../middleware/upload");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rateLimit_1 = require("../../middleware/rateLimit");
const captcha_1 = require("../../middleware/captcha");
const reports_schema_1 = require("./reports.schema");
const ctrl = __importStar(require("./reports.controller"));
const router = (0, express_1.Router)();
/**
 * @openapi
 * /reports/categories:
 *   get:
 *     tags: [Reports]
 *     summary: List active report categories (public)
 */
router.get('/categories', ctrl.listCategories);
/**
 * @openapi
 * /reports:
 *   post:
 *     tags: [Reports]
 *     summary: Submit a report with photo/video evidence (anonymous or authenticated)
 *     description: Multipart form. Field `media` accepts up to MAX_FILES_PER_REPORT files.
 */
router.post('/', rateLimit_1.reportLimiter, auth_1.optionalAuth, // logged-in users are linked; anonymous allowed
captcha_1.verifyCaptcha, upload_1.upload.array('media'), (0, validate_1.validate)({ body: reports_schema_1.createReportSchema }), ctrl.createReport);
/**
 * @openapi
 * /reports/mine:
 *   get:
 *     tags: [Reports]
 *     summary: List the authenticated user's own reports
 */
router.get('/mine', auth_1.requireAuth, (0, validate_1.validate)({ query: reports_schema_1.listMyReportsSchema }), ctrl.listMyReports);
/**
 * @openapi
 * /reports/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Get a single report (own report for citizens, any for staff)
 */
router.get('/:id', auth_1.requireAuth, (0, validate_1.validate)({ params: reports_schema_1.reportIdSchema }), ctrl.getReport);
exports.default = router;
//# sourceMappingURL=reports.routes.js.map