"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringId = void 0;
exports.applyBaseConfig = applyBaseConfig;
/**
 * Shared Mongoose building blocks so every model behaves like the old Prisma
 * models did: a string UUID primary key exposed as `id` (never `_id`/`__v`),
 * and consistent JSON/object serialization including virtual relations.
 */
const crypto_1 = require("crypto");
/** String UUID `_id` (matches Prisma's `@id @default(uuid())`). */
exports.stringId = {
    _id: { type: String, default: () => (0, crypto_1.randomUUID)() },
};
function stripId(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
}
/**
 * Applies the shared config to a schema: timestamps (per Prisma's per-model
 * declaration), no version key, and id-mapping serialization with virtuals so
 * populated relations (category/reporter/actor) and `id` surface in responses.
 * Set via `schema.set(...)` to avoid binding the constructor's doc-type generic.
 */
function applyBaseConfig(schema, timestamps) {
    schema.set('timestamps', timestamps);
    schema.set('versionKey', false);
    schema.set('toObject', { virtuals: true, transform: stripId });
    schema.set('toJSON', { virtuals: true, transform: stripId });
}
//# sourceMappingURL=_shared.js.map