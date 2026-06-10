"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaAsset = void 0;
const mongoose_1 = require("mongoose");
const _shared_1 = require("./_shared");
const enums_1 = require("./enums");
const MediaAssetSchema = new mongoose_1.Schema({
    ..._shared_1.stringId,
    reportId: { type: String, ref: 'Report', required: true, index: true },
    kind: { type: String, enum: Object.values(enums_1.MediaKind), required: true },
    storageKey: { type: String, required: true, unique: true },
    processedKey: { type: String, default: null },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    exifLat: { type: Number, default: null },
    exifLng: { type: Number, default: null },
    exifTakenAt: { type: Date, default: null },
    sha256: { type: String, default: null },
});
(0, _shared_1.applyBaseConfig)(MediaAssetSchema, { createdAt: true, updatedAt: false });
exports.MediaAsset = mongoose_1.models.MediaAsset ||
    (0, mongoose_1.model)('MediaAsset', MediaAssetSchema);
//# sourceMappingURL=MediaAsset.js.map