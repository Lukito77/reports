"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentRecord = void 0;
const mongoose_1 = require("mongoose");
const _shared_1 = require("./_shared");
const ConsentRecordSchema = new mongoose_1.Schema({
    ..._shared_1.stringId,
    reportId: { type: String, ref: 'Report', required: true, unique: true },
    policyVersion: { type: String, required: true },
    consentText: { type: String, required: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    acceptedAt: { type: Date, default: () => new Date() },
});
// acceptedAt is managed explicitly; no createdAt/updatedAt.
(0, _shared_1.applyBaseConfig)(ConsentRecordSchema, false);
exports.ConsentRecord = mongoose_1.models.ConsentRecord ||
    (0, mongoose_1.model)('ConsentRecord', ConsentRecordSchema);
//# sourceMappingURL=ConsentRecord.js.map