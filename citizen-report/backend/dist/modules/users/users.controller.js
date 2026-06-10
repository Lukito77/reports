"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = me;
exports.exportData = exportData;
exports.eraseAccount = eraseAccount;
const error_1 = require("../../middleware/error");
const audit_1 = require("../../lib/audit");
const models_1 = require("../../models");
/** Current user's profile. */
async function me(req, res) {
    if (!req.user)
        throw error_1.ApiError.unauthorized();
    const user = await models_1.User.findById(req.user.id).select('email displayName role emailVerified createdAt');
    res.json({ user });
}
/**
 * GDPR data export: returns all personal data we hold for the user, including
 * their reports (metadata only — media is downloadable via the report endpoints).
 */
async function exportData(req, res) {
    if (!req.user)
        throw error_1.ApiError.unauthorized();
    const user = await models_1.User.findById(req.user.id).select('email displayName role createdAt');
    const reportDocs = await models_1.Report.find({ reporterId: req.user.id }).populate({
        path: 'category',
        select: '-_id slug name',
    });
    const media = await models_1.MediaAsset.find({ reportId: { $in: reportDocs.map((r) => r.id) } }).select('reportId kind mimeType createdAt');
    const mediaByReport = new Map();
    for (const m of media) {
        const list = mediaByReport.get(m.reportId) ?? [];
        list.push({ id: m.id, kind: m.kind, mimeType: m.mimeType, createdAt: m.createdAt });
        mediaByReport.set(m.reportId, list);
    }
    const reports = reportDocs.map((r) => {
        const obj = r.toObject();
        obj.media = mediaByReport.get(r.id) ?? [];
        return obj;
    });
    await (0, audit_1.recordAudit)({ action: models_1.AuditAction.DATA_EXPORTED, actorId: req.user.id, req });
    res.setHeader('Content-Disposition', 'attachment; filename="citizen-report-export.json"');
    res.json({ exportedAt: new Date().toISOString(), user, reports });
}
/**
 * GDPR erasure: anonymizes the user's reports (keeps them for the public-interest
 * record but severs the link to the person) and deletes the account.
 */
async function eraseAccount(req, res) {
    if (!req.user)
        throw error_1.ApiError.unauthorized();
    const userId = req.user.id;
    // Detach reports from the person; mark anonymous and clear encrypted contact.
    await models_1.Report.updateMany({ reporterId: userId }, { reporterId: null, anonymous: true, contactEnc: null });
    await models_1.RefreshToken.deleteMany({ userId });
    await (0, audit_1.recordAudit)({ action: models_1.AuditAction.DATA_ERASED, actorId: null, metadata: { erasedUserId: userId }, req });
    await models_1.User.deleteOne({ _id: userId });
    res.clearCookie('crp_refresh', { path: '/api/auth' });
    res.json({ message: 'Account erased. Your reports have been anonymized.' });
}
//# sourceMappingURL=users.controller.js.map