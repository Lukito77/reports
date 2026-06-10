"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const _shared_1 = require("./_shared");
const enums_1 = require("./enums");
const AuditLogSchema = new mongoose_1.Schema({
    ..._shared_1.stringId,
    action: { type: String, enum: Object.values(enums_1.AuditAction), required: true, index: true },
    actorId: { type: String, ref: 'User', default: null, index: true },
    reportId: { type: String, ref: 'Report', default: null, index: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
});
(0, _shared_1.applyBaseConfig)(AuditLogSchema, { createdAt: true, updatedAt: false });
AuditLogSchema.index({ createdAt: -1 });
// Lets `listAuditLogs` populate the acting user.
AuditLogSchema.virtual('actor', {
    ref: 'User',
    localField: 'actorId',
    foreignField: '_id',
    justOne: true,
});
exports.AuditLog = mongoose_1.models.AuditLog || (0, mongoose_1.model)('AuditLog', AuditLogSchema);
//# sourceMappingURL=AuditLog.js.map