"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReport = createReport;
exports.listMyReports = listMyReports;
exports.getReport = getReport;
exports.listCategories = listCategories;
exports.hardDeleteReport = hardDeleteReport;
exports.deleteMyReport = deleteMyReport;
/**
 * Report domain logic: secure media ingestion (type sniffing, EXIF GPS
 * extraction, face blurring, tamper detection, integrity hashing), persistence,
 * and reader access with signed media URLs.
 */
const crypto_1 = __importDefault(require("crypto"));
const exifr_1 = __importDefault(require("exifr"));
const sharp_1 = __importDefault(require("sharp"));
const models_1 = require("../../models");
const error_1 = require("../../middleware/error");
const crypto_2 = require("../../lib/crypto");
const storage_1 = require("../../lib/storage");
const upload_1 = require("../../middleware/upload");
const ai = __importStar(require("../ai/ai.service"));
const audit_1 = require("../../lib/audit");
/** Process one uploaded file: verify type, extract EXIF, blur faces, hash, store. */
async function ingestFile(file) {
    const realMime = await (0, upload_1.assertRealFileType)(file.buffer, file.mimetype);
    const isImage = upload_1.ALLOWED_IMAGE_MIME.includes(realMime);
    const ext = realMime.split('/')[1] ?? 'bin';
    const sha256 = crypto_1.default.createHash('sha256').update(file.buffer).digest('hex');
    const media = {
        kind: isImage ? models_1.MediaKind.IMAGE : models_1.MediaKind.VIDEO,
        storageKey: (0, storage_1.newStorageKey)('original', ext),
        mimeType: realMime,
        sizeBytes: file.size,
        sha256,
        ai: {},
    };
    if (isImage) {
        // Extract GPS + capture time from EXIF (best-effort).
        try {
            const gps = await exifr_1.default.gps(file.buffer);
            if (gps && typeof gps.latitude === 'number') {
                media.exifLat = gps.latitude;
                media.exifLng = gps.longitude;
            }
            const meta = await exifr_1.default.parse(file.buffer, ['DateTimeOriginal']).catch(() => null);
            if (meta?.DateTimeOriginal instanceof Date)
                media.exifTakenAt = meta.DateTimeOriginal;
        }
        catch {
            /* EXIF optional */
        }
        try {
            const dims = await (0, sharp_1.default)(file.buffer).metadata();
            media.width = dims.width;
            media.height = dims.height;
        }
        catch {
            /* ignore */
        }
        // AI-assisted (advisory) analysis.
        media.ai.plates = await ai.detectPlates(file.buffer);
        media.ai.tamper = await ai.detectTampering(file.buffer);
        // Privacy: produce a face-blurred, metadata-stripped derivative for reviewers.
        const blurred = await ai.blurFaces(file.buffer);
        media.ai.facesBlurred = blurred.facesBlurred;
        media.processedKey = (0, storage_1.newStorageKey)('processed', 'jpg');
        await (0, storage_1.putObject)(media.processedKey, blurred.buffer, 'image/jpeg');
    }
    // Always store the original in the private bucket.
    await (0, storage_1.putObject)(media.storageKey, file.buffer, realMime);
    return media;
}
async function createReport(input, files, ctx) {
    if (!input.consentGiven) {
        throw error_1.ApiError.badRequest('Consent is required before submitting a report');
    }
    if (files.length === 0) {
        throw error_1.ApiError.badRequest('At least one photo is required as evidence');
    }
    const category = await models_1.Category.findOne({ slug: input.categorySlug });
    if (!category || !category.active)
        throw error_1.ApiError.badRequest('Invalid category');
    // Anonymous unless explicitly logged in AND not requesting anonymity.
    const anonymous = input.anonymous || !ctx.userId;
    const ingested = await Promise.all(files.map(ingestFile));
    // Derive location/time from EXIF when the user didn't supply them.
    const exifWithGps = ingested.find((m) => m.exifLat != null);
    const latitude = input.latitude ?? exifWithGps?.exifLat;
    const longitude = input.longitude ?? exifWithGps?.exifLng;
    const incidentAt = input.incidentAt ?? ingested.find((m) => m.exifTakenAt)?.exifTakenAt ?? undefined;
    const summary = ai.generateSummary({
        categoryName: category.name,
        description: input.description,
        address: input.address,
        incidentAt: incidentAt ?? null,
        mediaCount: ingested.length,
    });
    const report = await models_1.Report.create({
        reporterId: anonymous ? null : ctx.userId,
        anonymous,
        contactEnc: (0, crypto_2.encrypt)(input.contact ?? null),
        categoryId: category.id,
        description: input.description,
        summary,
        latitude,
        longitude,
        address: input.address,
        incidentAt,
        consentGiven: true,
        status: models_1.ReportStatus.SUBMITTED,
    });
    // Media + consent live in their own collections (was a nested Prisma create).
    const mediaDocs = await models_1.MediaAsset.insertMany(ingested.map((m) => ({
        reportId: report.id,
        kind: m.kind,
        storageKey: m.storageKey,
        processedKey: m.processedKey,
        mimeType: m.mimeType,
        sizeBytes: m.sizeBytes,
        width: m.width,
        height: m.height,
        exifLat: m.exifLat,
        exifLng: m.exifLng,
        exifTakenAt: m.exifTakenAt,
        sha256: m.sha256,
    })));
    await models_1.ConsentRecord.create({
        reportId: report.id,
        policyVersion: input.policyVersion,
        consentText: input.consentText ?? 'Standard consent notice accepted.',
        ip: ctx.ip,
        userAgent: ctx.userAgent?.slice(0, 512),
    });
    // Persist AI analyses (advisory).
    const aiRows = [];
    mediaDocs.forEach((dbMedia, i) => {
        const m = ingested[i];
        if (m.ai.plates && m.ai.plates.plates.length > 0) {
            aiRows.push({
                reportId: report.id,
                mediaId: dbMedia.id,
                type: models_1.AiAnalysisType.PLATE_OCR,
                result: m.ai.plates.plates,
                provider: m.ai.plates.provider,
            });
        }
        if (m.ai.tamper) {
            aiRows.push({
                reportId: report.id,
                mediaId: dbMedia.id,
                type: models_1.AiAnalysisType.TAMPER_DETECTION,
                result: m.ai.tamper,
                confidence: m.ai.tamper.score,
                provider: m.ai.tamper.provider,
            });
        }
        if (m.ai.facesBlurred != null) {
            aiRows.push({
                reportId: report.id,
                mediaId: dbMedia.id,
                type: models_1.AiAnalysisType.FACE_BLUR,
                result: { facesBlurred: m.ai.facesBlurred },
            });
        }
    });
    aiRows.push({
        reportId: report.id,
        type: models_1.AiAnalysisType.SUMMARY,
        result: { summary },
    });
    if (aiRows.length)
        await models_1.AiAnalysis.insertMany(aiRows);
    await (0, audit_1.recordAudit)({
        action: models_1.AuditAction.REPORT_CREATED,
        actorId: ctx.userId ?? null,
        reportId: report.id,
        metadata: { anonymous, category: category.slug, mediaCount: ingested.length },
    });
    // Mirror Prisma's `include: { media: true, category: true }`.
    const result = report.toObject();
    result.category = category.toObject();
    result.media = mediaDocs.map((d) => d.toObject());
    return sanitizeReport(result);
}
/** Strip sensitive fields from a report before returning to a citizen. */
function sanitizeReport(report) {
    const { contactEnc, ...rest } = report;
    void contactEnc;
    return rest;
}
/** Fetch `{ id, kind }` media summaries grouped by report id. */
async function mediaSummariesByReport(reportIds) {
    const media = await models_1.MediaAsset.find({ reportId: { $in: reportIds } }).select('reportId kind');
    const byReport = new Map();
    for (const m of media) {
        const list = byReport.get(m.reportId) ?? [];
        list.push({ id: m.id, kind: m.kind });
        byReport.set(m.reportId, list);
    }
    return byReport;
}
async function listMyReports(userId, opts) {
    const where = { reporterId: userId };
    if (opts.status)
        where.status = opts.status;
    const [docs, total] = await Promise.all([
        models_1.Report.find(where)
            .sort({ createdAt: -1 })
            .skip((opts.page - 1) * opts.pageSize)
            .limit(opts.pageSize)
            .populate('category'),
        models_1.Report.countDocuments(where),
    ]);
    const mediaByReport = await mediaSummariesByReport(docs.map((d) => d.id));
    const items = docs.map((d) => {
        const obj = d.toObject();
        obj.media = mediaByReport.get(d.id) ?? [];
        return sanitizeReport(obj);
    });
    return { items, total, page: opts.page, pageSize: opts.pageSize };
}
/**
 * Fetch a single report. Citizens may only read their own; moderators/admins any.
 * Returns signed URLs for the privacy-processed media (originals only to staff).
 */
async function getReport(id, viewer) {
    const report = await models_1.Report.findById(id).populate('category');
    if (!report)
        throw error_1.ApiError.notFound('Report not found');
    const isStaff = viewer.role === models_1.Role.ADMIN || viewer.role === models_1.Role.MODERATOR;
    if (!isStaff && report.reporterId !== viewer.id)
        throw error_1.ApiError.forbidden();
    const [mediaDocs, aiDocs] = await Promise.all([
        models_1.MediaAsset.find({ reportId: id }),
        models_1.AiAnalysis.find({ reportId: id }),
    ]);
    // Build signed URLs. Citizens see only the processed (blurred) derivative.
    const media = await Promise.all(mediaDocs.map(async (m) => {
        const viewKey = isStaff ? m.storageKey : m.processedKey ?? m.storageKey;
        // The processed derivative is always an image; originals may be video.
        const resourceType = viewKey === m.processedKey ? 'image' : m.kind === models_1.MediaKind.VIDEO ? 'video' : 'image';
        return {
            id: m.id,
            kind: m.kind,
            mimeType: m.mimeType,
            width: m.width,
            height: m.height,
            exifLat: isStaff ? m.exifLat : undefined,
            exifLng: isStaff ? m.exifLng : undefined,
            exifTakenAt: m.exifTakenAt,
            url: await (0, storage_1.getSignedDownloadUrl)(viewKey, resourceType),
        };
    }));
    // Decrypt plate text only for staff.
    const aiAnalyses = aiDocs.map((doc) => {
        const a = doc.toObject();
        if (a.type === models_1.AiAnalysisType.PLATE_OCR && isStaff && Array.isArray(a.result)) {
            const plates = a.result.map((p) => ({
                text: (0, crypto_2.decrypt)(p.textEncrypted),
                confidence: p.confidence,
            }));
            return { ...a, result: plates };
        }
        if (a.type === models_1.AiAnalysisType.PLATE_OCR && !isStaff) {
            return { ...a, result: { redacted: true } };
        }
        return a;
    });
    return {
        ...sanitizeReport(report.toObject()),
        media,
        aiAnalyses,
    };
}
/** Public list of categories for the submission form. */
function listCategories() {
    return models_1.Category.find({ active: true })
        .select('-_id slug name nameEn description')
        .sort({ name: 1 })
        .lean();
}
/** Permanently delete a report and its media objects (GDPR erasure / retention). */
async function hardDeleteReport(id) {
    const media = await models_1.MediaAsset.find({ reportId: id });
    await Promise.allSettled(media.flatMap((m) => [
        (0, storage_1.deleteObject)(m.storageKey, m.kind === models_1.MediaKind.VIDEO ? 'video' : 'image'),
        m.processedKey ? (0, storage_1.deleteObject)(m.processedKey, 'image') : Promise.resolve(),
    ]));
    // Cascade the dependent collections (Prisma did this via onDelete: Cascade).
    await Promise.all([
        models_1.MediaAsset.deleteMany({ reportId: id }),
        models_1.AiAnalysis.deleteMany({ reportId: id }),
        models_1.ConsentRecord.deleteMany({ reportId: id }),
    ]);
    await models_1.Report.deleteOne({ _id: id });
}
/**
 * A citizen permanently deletes their OWN report (and its media). Anonymous
 * reports have no owner, so they can only be removed by staff via the admin path.
 */
async function deleteMyReport(reportId, user, req) {
    const report = await models_1.Report.findById(reportId);
    if (!report)
        throw error_1.ApiError.notFound('Report not found');
    if (report.reporterId !== user.id)
        throw error_1.ApiError.forbidden();
    await (0, audit_1.recordAudit)({
        action: models_1.AuditAction.REPORT_DELETED,
        actorId: user.id,
        reportId,
        metadata: { status: report.status, deletedByReporter: true },
        req,
    });
    await hardDeleteReport(reportId);
}
//# sourceMappingURL=reports.service.js.map