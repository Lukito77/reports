"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const _shared_1 = require("./_shared");
const enums_1 = require("./enums");
const UserSchema = new mongoose_1.Schema({
    ..._shared_1.stringId,
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: null },
    role: { type: String, enum: Object.values(enums_1.Role), default: enums_1.Role.CITIZEN, index: true },
    permissions: { type: [String], default: [] },
    emailVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    verifyToken: { type: String, default: null },
    verifyTokenExpiry: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
});
(0, _shared_1.applyBaseConfig)(UserSchema, true);
// ⚡ მხოლოდ ჩვეულებრივი ინდექსები უნიკალურობის (unique) გარეშე, რათა null-ებზე არასდროს გაჭედოს
UserSchema.index({ verifyToken: 1 });
UserSchema.index({ resetToken: 1 });
exports.User = mongoose_1.models.User || (0, mongoose_1.model)('User', UserSchema);
//# sourceMappingURL=User.js.map