"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReports = listReports;
exports.updateStatus = updateStatus;
exports.changeUserRole = changeUserRole;
exports.listAuditLogs = listAuditLogs;
exports.stats = stats;
const models_1 = require("../../models");
const error_1 = require("../../middleware/error");
const audit_1 = require("../../lib/audit");
// Allowed transitions. SUBMITTED can go to review/info/approve/reject; etc.
const TRANSITIONS = {
    SUBMITTED: ['UNDER_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED'],
    UNDER_REVIEW: ['INFO_REQUESTED', 'APPROVED', 'REJECTED', 'CLOSED'],
    INFO_REQUESTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'],
    APPROVED: ['CLOSED'],
    REJECTED: ['CLOSED'],
    CLOSED: [],
};
const ACTION_FOR_STATUS = {
    APPROVED: models_1.AuditAction.REPORT_APPROVED,
    REJECTED: models_1.AuditAction.REPORT_REJECTED,
    INFO_REQUESTED: models_1.AuditAction.INFO_REQUESTED,
    CLOSED: models_1.AuditAction.REPORT_CLOSED,
    UNDER_REVIEW: models_1.AuditAction.STATUS_CHANGED,
};
async function listReports(f) {
    const where = {};
    if (f.status)
        where.status = f.status;
    if (f.categorySlug) {
        // Category is a separate collection; resolve slug -> id first.
        const category = await models_1.Category.findOne({ slug: f.categorySlug }).select('_id');
        // No match -> ensure an empty result set rather than ignoring the filter.
        where.categoryId = category ? category.id : '__no_such_category__';
    }
    if (f.from || f.to) {
        const range = {};
        if (f.from)
            range.$gte = f.from;
        if (f.to)
            range.$lte = f.to;
        where.createdAt = range;
    }
    if (f.minLat != null || f.maxLat != null) {
        const range = {};
        if (f.minLat != null)
            range.$gte = f.minLat;
        if (f.maxLat != null)
            range.$lte = f.maxLat;
        where.latitude = range;
    }
    if (f.minLng != null || f.maxLng != null) {
        const range = {};
        if (f.minLng != null)
            range.$gte = f.minLng;
        if (f.maxLng != null)
            range.$lte = f.maxLng;
        where.longitude = range;
    }
    if (f.q) {
        // Case-insensitive substring match (was Prisma `contains` + `mode: insensitive`).
        where.description = { $regex: escapeRegex(f.q), $options: 'i' };
    }
    const filter = where;
    const [docs, total] = await Promise.all([
        models_1.Report.find(filter)
            .sort({ createdAt: -1 })
            .skip((f.page - 1) * f.pageSize)
            .limit(f.pageSize)
            .populate('category')
            .populate({ path: 'reporter', select: 'email displayName' }),
        models_1.Report.countDocuments(filter),
    ]);
    // Attach media summaries + counts (was `include.media` + `_count.media`).
    const media = await models_1.MediaAsset.find({ reportId: { $in: docs.map((d) => d.id) } }).select('reportId kind');
    const mediaByReport = new Map();
    for (const m of media) {
        const list = mediaByReport.get(m.reportId) ?? [];
        list.push({ id: m.id, kind: m.kind });
        mediaByReport.set(m.reportId, list);
    }
    // Never leak encrypted contact in list view.
    const items = docs.map((d) => {
        const { contactEnc, ...r } = d.toObject();
        void contactEnc;
        const mediaList = mediaByReport.get(d.id) ?? [];
        return { ...r, media: mediaList, _count: { media: mediaList.length } };
    });
    return { items, total, page: f.page, pageSize: f.pageSize };
}
async function updateStatus(reportId, next, note, actorId, req) {
    const report = await models_1.Report.findById(reportId);
    if (!report)
        throw error_1.ApiError.notFound('Report not found');
    const allowed = TRANSITIONS[report.status];
    if (!allowed.includes(next)) {
        throw error_1.ApiError.badRequest(`Cannot change status from ${report.status} to ${next}`);
    }
    const updated = await models_1.Report.findByIdAndUpdate(reportId, {
        status: next,
        reviewerNote: next === models_1.ReportStatus.INFO_REQUESTED ? note ?? report.reviewerNote : report.reviewerNote,
    }, { new: true }).populate('category');
    await (0, audit_1.recordAudit)({
        action: ACTION_FOR_STATUS[next] ?? models_1.AuditAction.STATUS_CHANGED,
        actorId,
        reportId,
        metadata: { from: report.status, to: next, note: note ?? null },
        req,
    });
    const { contactEnc, ...safe } = updated.toObject();
    void contactEnc;
    return safe;
}
async function changeUserRole(targetUserId, role, actorId, req) {
    const user = await models_1.User.findById(targetUserId);
    if (!user)
        throw error_1.ApiError.notFound('User not found');
    // Bumping tokenVersion forces re-auth with the new role.
    const updated = await models_1.User.findByIdAndUpdate(targetUserId, { role, $inc: { tokenVersion: 1 } }, { new: true }).select('email role');
    await (0, audit_1.recordAudit)({
        action: models_1.AuditAction.USER_ROLE_CHANGED,
        actorId,
        metadata: { targetUserId, from: user.role, to: role },
        req,
    });
    return updated;
}
async function listAuditLogs(opts) {
    const where = {};
    if (opts.reportId)
        where.reportId = opts.reportId;
    if (opts.actorId)
        where.actorId = opts.actorId;
    const [items, total] = await Promise.all([
        models_1.AuditLog.find(where)
            .sort({ createdAt: -1 })
            .skip((opts.page - 1) * opts.pageSize)
            .limit(opts.pageSize)
            .populate({ path: 'actor', select: 'email role' }),
        models_1.AuditLog.countDocuments(where),
    ]);
    return { items, total, page: opts.page, pageSize: opts.pageSize };
}
async function stats() {
    const byStatusRows = await models_1.Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const total = await models_1.Report.countDocuments();
    return {
        total,
        byStatus: Object.fromEntries(byStatusRows.map((s) => [s._id, s.count])),
    };
}
/** Escape user input before embedding it in a regular expression. */
function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=admin.service.js.map