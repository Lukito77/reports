"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAnalysis = void 0;
const mongoose_1 = require("mongoose");
const _shared_1 = require("./_shared");
const enums_1 = require("./enums");
const AiAnalysisSchema = new mongoose_1.Schema({
    ..._shared_1.stringId,
    reportId: { type: String, ref: 'Report', required: true, index: true },
    mediaId: { type: String, ref: 'MediaAsset', default: null },
    type: { type: String, enum: Object.values(enums_1.AiAnalysisType), required: true, index: true },
    result: { type: mongoose_1.Schema.Types.Mixed, required: true },
    confidence: { type: Number, default: null },
    provider: { type: String, default: null },
});
(0, _shared_1.applyBaseConfig)(AiAnalysisSchema, { createdAt: true, updatedAt: false });
exports.AiAnalysis = mongoose_1.models.AiAnalysis ||
    (0, mongoose_1.model)('AiAnalysis', AiAnalysisSchema);
//# sourceMappingURL=AiAnalysis.js.map