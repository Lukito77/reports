"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const _shared_1 = require("./_shared");
const CategorySchema = new mongoose_1.Schema({
    ..._shared_1.stringId,
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    active: { type: Boolean, default: true },
});
(0, _shared_1.applyBaseConfig)(CategorySchema, { createdAt: true, updatedAt: false });
exports.Category = mongoose_1.models.Category || (0, mongoose_1.model)('Category', CategorySchema);
//# sourceMappingURL=Category.js.map