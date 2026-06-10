"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
const mongoose_1 = require("mongoose");
const _shared_1 = require("./_shared");
const RefreshTokenSchema = new mongoose_1.Schema({
    ..._shared_1.stringId,
    userId: { type: String, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
    createdByIp: { type: String, default: null },
    userAgent: { type: String, default: null },
});
(0, _shared_1.applyBaseConfig)(RefreshTokenSchema, { createdAt: true, updatedAt: false });
exports.RefreshToken = mongoose_1.models.RefreshToken ||
    (0, mongoose_1.model)('RefreshToken', RefreshTokenSchema);
//# sourceMappingURL=RefreshToken.js.map