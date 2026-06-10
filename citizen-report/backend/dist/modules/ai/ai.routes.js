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
/**
 * On-demand AI utilities for staff (e.g. re-run plate OCR or tamper analysis on
 * an uploaded image during review). Advisory only — results never drive enforcement.
 */
const express_1 = require("express");
const enums_1 = require("../../models/enums");
const auth_1 = require("../../middleware/auth");
const upload_1 = require("../../middleware/upload");
const error_1 = require("../../middleware/error");
const ai = __importStar(require("./ai.service"));
const crypto_1 = require("../../lib/crypto");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, (0, auth_1.requireRole)(enums_1.Role.ADMIN, enums_1.Role.MODERATOR));
/**
 * @openapi
 * /ai/analyze:
 *   post:
 *     tags: [AI]
 *     summary: Run plate OCR + tamper detection on a single image (staff only)
 */
router.post('/analyze', upload_1.upload.single('image'), async (req, res) => {
    const file = req.file;
    if (!file)
        throw error_1.ApiError.badRequest('image file required');
    await (0, upload_1.assertRealFileType)(file.buffer, file.mimetype);
    const [plates, tamper] = await Promise.all([
        ai.detectPlates(file.buffer),
        ai.detectTampering(file.buffer),
    ]);
    res.json({
        plates: plates.plates.map((p) => ({ text: (0, crypto_1.decrypt)(p.textEncrypted), confidence: p.confidence })),
        tamper,
        note: 'Advisory only. Results must be confirmed by a human reviewer.',
    });
});
exports.default = router;
//# sourceMappingURL=ai.routes.js.map