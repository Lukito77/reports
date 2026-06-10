"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const mongoose_1 = require("mongoose");
const _shared_1 = require("./_shared");
const enums_1 = require("./enums");
const ReportSchema = new mongoose_1.Schema({
    ..._shared_1.stringId,
    reporterId: { type: String, ref: 'User', default: null, index: true },
    anonymous: { type: Boolean, default: false },
    contactEnc: { type: String, default: null },
    categoryId: { type: String, ref: 'Category', required: true, index: true },
    status: {
        type: String,
        enum: Object.values(enums_1.ReportStatus),
        default: enums_1.ReportStatus.SUBMITTED,
        index: true,
    },
    description: { type: String, required: true },
    summary: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: null },
    incidentAt: { type: Date, default: null },
    consentGiven: { type: Boolean, default: false },
    reviewerNote: { type: String, default: null },
});
(0, _shared_1.applyBaseConfig)(ReportSchema, true);
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ latitude: 1, longitude: 1 });
// Relation virtuals so service code can `.populate('category')` / `.populate('reporter')`
// and read `report.category` / `report.reporter` just like the old Prisma relations.
ReportSchema.virtual('category', {
    ref: 'Category',
    localField: 'categoryId',
    foreignField: '_id',
    justOne: true,
});
ReportSchema.virtual('reporter', {
    ref: 'User',
    localField: 'reporterId',
    foreignField: '_id',
    justOne: true,
});
exports.Report = mongoose_1.models.Report || (0, mongoose_1.model)('Report', ReportSchema);
//# sourceMappingURL=Report.js.map