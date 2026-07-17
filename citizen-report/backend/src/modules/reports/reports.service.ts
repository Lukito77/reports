/**
 * Report domain logic: secure media ingestion (type sniffing, EXIF GPS
 * extraction, face blurring, tamper detection, integrity hashing), persistence,
 * and reader access with signed media URLs.
 */
import crypto from 'crypto';
import exifr from 'exifr';
import sharp from 'sharp';
import type { FilterQuery } from 'mongoose';
import {
  MediaKind,
  ReportStatus,
  Role,
  AuditAction,
  AiAnalysisType,
  Report,
  MediaAsset,
  AiAnalysis,
  ConsentRecord,
  Category,
  type IReport,
} from '../../models';
import { ApiError } from '../../middleware/error';
import { encrypt, decrypt } from '../../lib/crypto';
import {
  newStorageKey,
  putObject,
  getSignedDownloadUrl,
  deleteObject,
} from '../../lib/storage';
import { assertRealFileType, ALLOWED_IMAGE_MIME } from '../../middleware/upload';
import * as ai from '../ai/ai.service';
import { recordAudit } from '../../lib/audit';
import type { CreateReportInput } from './reports.schema';

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

interface IngestedMedia {
  kind: MediaKind;
  storageKey: string;
  processedKey?: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  exifLat?: number;
  exifLng?: number;
  exifTakenAt?: Date;
  sha256: string;
  ai: {
    plates?: ai.PlateResult;
    tamper?: ai.TamperResult;
    facesBlurred?: number;
  };
}

interface AiAnalysisRow {
  reportId: string;
  mediaId?: string;
  type: AiAnalysisType;
  result: unknown;
  confidence?: number;
  provider?: string;
}

/** Process one uploaded file: verify type, extract EXIF, blur faces, hash, store. */
async function ingestFile(file: UploadedFile): Promise<IngestedMedia> {
  const realMime = await assertRealFileType(file.buffer, file.mimetype);
  const isImage = ALLOWED_IMAGE_MIME.includes(realMime);
  const ext = realMime.split('/')[1] ?? 'bin';
  const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

  const media: IngestedMedia = {
    kind: isImage ? MediaKind.IMAGE : MediaKind.VIDEO,
    storageKey: newStorageKey('original', ext),
    mimeType: realMime,
    sizeBytes: file.size,
    sha256,
    ai: {},
  };

  if (isImage) {
    // Extract GPS + capture time from EXIF (best-effort).
    try {
      const gps = await exifr.gps(file.buffer);
      if (gps && typeof gps.latitude === 'number') {
        media.exifLat = gps.latitude;
        media.exifLng = gps.longitude;
      }
      const meta = await exifr.parse(file.buffer, ['DateTimeOriginal']).catch(() => null);
      if (meta?.DateTimeOriginal instanceof Date) media.exifTakenAt = meta.DateTimeOriginal;
    } catch {
      /* EXIF optional */
    }

    try {
      const dims = await sharp(file.buffer).metadata();
      media.width = dims.width;
      media.height = dims.height;
    } catch {
      /* ignore */
    }

    // AI-assisted (advisory) analysis.
    media.ai.plates = await ai.detectPlates(file.buffer);
    media.ai.tamper = await ai.detectTampering(file.buffer);

    // Privacy: produce a face-blurred, metadata-stripped derivative for reviewers.
    const blurred = await ai.blurFaces(file.buffer).catch(() => {
      throw ApiError.badRequest('This photo could not be processed. Please try a different file.');
    });
    media.ai.facesBlurred = blurred.facesBlurred;
    media.processedKey = newStorageKey('processed', 'jpg');
    await putObject(media.processedKey, blurred.buffer, 'image/jpeg');
  }

  // Always store the original in the private bucket.
  await putObject(media.storageKey, file.buffer, realMime);
  return media;
}

export async function createReport(
  input: CreateReportInput,
  files: UploadedFile[],
  ctx: { userId?: string; emailVerified?: boolean; ip?: string; userAgent?: string },
) {
  if (!input.consentGiven) {
    throw ApiError.badRequest('Consent is required before submitting a report');
  }
  if (files.length === 0) {
    throw ApiError.badRequest('At least one photo is required as evidence');
  }

  const category = await Category.findOne({ slug: input.categorySlug });
  if (!category || !category.active) throw ApiError.badRequest('Invalid category');

  // Anonymous unless explicitly logged in AND not requesting anonymity.
  const anonymous = input.anonymous || !ctx.userId;

  const ingested = await Promise.all(files.map(ingestFile));

  // Derive location/time from EXIF when the user didn't supply them.
  const exifWithGps = ingested.find((m) => m.exifLat != null);
  const latitude = input.latitude ?? exifWithGps?.exifLat;
  const longitude = input.longitude ?? exifWithGps?.exifLng;
  const incidentAt =
    input.incidentAt ?? ingested.find((m) => m.exifTakenAt)?.exifTakenAt ?? undefined;

  const summary = ai.generateSummary({
    categoryName: category.name,
    description: input.description,
    address: input.address,
    incidentAt: incidentAt ?? null,
    mediaCount: ingested.length,
  });

  const report = await Report.create({
    reporterId: anonymous ? null : ctx.userId,
    anonymous,
    contactEnc: encrypt(input.contact ?? null),
    categoryId: category.id,
    description: input.description,
    summary,
    latitude,
    longitude,
    address: input.address,
    incidentAt,
    consentGiven: true,
    status: ReportStatus.SUBMITTED,
  });

  // Media + consent live in their own collections (was a nested Prisma create).
  const mediaDocs = await MediaAsset.insertMany(
    ingested.map((m) => ({
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
    })),
  );

  await ConsentRecord.create({
    reportId: report.id,
    policyVersion: input.policyVersion,
    consentText: input.consentText ?? 'Standard consent notice accepted.',
    ip: ctx.ip,
    userAgent: ctx.userAgent?.slice(0, 512),
  });

  // Persist AI analyses (advisory).
  const aiRows: AiAnalysisRow[] = [];
  mediaDocs.forEach((dbMedia, i) => {
    const m = ingested[i];
    if (m.ai.plates && m.ai.plates.plates.length > 0) {
      aiRows.push({
        reportId: report.id,
        mediaId: dbMedia.id,
        type: AiAnalysisType.PLATE_OCR,
        result: m.ai.plates.plates,
        provider: m.ai.plates.provider,
      });
    }
    if (m.ai.tamper) {
      aiRows.push({
        reportId: report.id,
        mediaId: dbMedia.id,
        type: AiAnalysisType.TAMPER_DETECTION,
        result: m.ai.tamper,
        confidence: m.ai.tamper.score,
        provider: m.ai.tamper.provider,
      });
    }
    if (m.ai.facesBlurred != null) {
      aiRows.push({
        reportId: report.id,
        mediaId: dbMedia.id,
        type: AiAnalysisType.FACE_BLUR,
        result: { facesBlurred: m.ai.facesBlurred },
      });
    }
  });
  aiRows.push({
    reportId: report.id,
    type: AiAnalysisType.SUMMARY,
    result: { summary },
  });
  if (aiRows.length) await AiAnalysis.insertMany(aiRows);

  await recordAudit({
    action: AuditAction.REPORT_CREATED,
    actorId: ctx.userId ?? null,
    reportId: report.id,
    metadata: { anonymous, category: category.slug, mediaCount: ingested.length },
  });

  // Mirror Prisma's `include: { media: true, category: true }`.
  const result = report.toObject() as unknown as Record<string, unknown>;
  result.category = category.toObject();
  result.media = mediaDocs.map((d) => d.toObject());
  return sanitizeReport(result);
}

/** Strip sensitive fields from a report before returning to a citizen. */
function sanitizeReport(report: { contactEnc?: string | null; [k: string]: unknown }) {
  const { contactEnc, ...rest } = report;
  void contactEnc;
  return rest;
}

/** Fetch `{ id, kind }` media summaries grouped by report id. */
async function mediaSummariesByReport(
  reportIds: string[],
): Promise<Map<string, { id: string; kind: MediaKind }[]>> {
  const media = await MediaAsset.find({ reportId: { $in: reportIds } }).select('reportId kind');
  const byReport = new Map<string, { id: string; kind: MediaKind }[]>();
  for (const m of media) {
    const list = byReport.get(m.reportId) ?? [];
    list.push({ id: m.id, kind: m.kind });
    byReport.set(m.reportId, list);
  }
  return byReport;
}

export async function listMyReports(
  userId: string,
  opts: { status?: ReportStatus; page: number; pageSize: number },
) {
  const where: FilterQuery<IReport> = { reporterId: userId };
  if (opts.status) where.status = opts.status;

  const [docs, total] = await Promise.all([
    Report.find(where)
      .sort({ createdAt: -1 })
      .skip((opts.page - 1) * opts.pageSize)
      .limit(opts.pageSize)
      .populate('category'),
    Report.countDocuments(where),
  ]);

  const mediaByReport = await mediaSummariesByReport(docs.map((d) => d.id));
  const items = docs.map((d) => {
    const obj = d.toObject() as unknown as Record<string, unknown>;
    obj.media = mediaByReport.get(d.id) ?? [];
    return sanitizeReport(obj);
  });

  return { items, total, page: opts.page, pageSize: opts.pageSize };
}

/**
 * Fetch a single report. Citizens may only read their own; moderators/admins any.
 * Returns signed URLs for the privacy-processed media (originals only to staff).
 */
export async function getReport(
  id: string,
  viewer: { id: string; role: Role },
) {
  const report = await Report.findById(id).populate('category');
  if (!report) throw ApiError.notFound('Report not found');

  const isStaff = viewer.role === Role.ADMIN || viewer.role === Role.MODERATOR;
  if (!isStaff && report.reporterId !== viewer.id) throw ApiError.forbidden();

  const [mediaDocs, aiDocs] = await Promise.all([
    MediaAsset.find({ reportId: id }),
    AiAnalysis.find({ reportId: id }),
  ]);

  // Build signed URLs. Citizens see only the processed (blurred) derivative.
  const media = await Promise.all(
    mediaDocs.map(async (m) => {
      const viewKey = isStaff ? m.storageKey : m.processedKey ?? m.storageKey;
      // The processed derivative is always an image; originals may be video.
      const resourceType =
        viewKey === m.processedKey ? 'image' : m.kind === MediaKind.VIDEO ? 'video' : 'image';
      return {
        id: m.id,
        kind: m.kind,
        mimeType: m.mimeType,
        width: m.width,
        height: m.height,
        exifLat: isStaff ? m.exifLat : undefined,
        exifLng: isStaff ? m.exifLng : undefined,
        exifTakenAt: m.exifTakenAt,
        url: await getSignedDownloadUrl(viewKey, resourceType),
      };
    }),
  );

  // Decrypt plate text only for staff.
  const aiAnalyses = aiDocs.map((doc) => {
    const a = doc.toObject();
    if (a.type === AiAnalysisType.PLATE_OCR && isStaff && Array.isArray(a.result)) {
      const plates = (a.result as { textEncrypted: string; confidence: number }[]).map((p) => ({
        text: decrypt(p.textEncrypted),
        confidence: p.confidence,
      }));
      return { ...a, result: plates };
    }
    if (a.type === AiAnalysisType.PLATE_OCR && !isStaff) {
      return { ...a, result: { redacted: true } };
    }
    return a;
  });

  return {
    ...sanitizeReport(report.toObject() as unknown as Record<string, unknown>),
    media,
    aiAnalyses,
  };
}

/** Public list of categories for the submission form. */
export function listCategories() {
  return Category.find({ active: true })
    .select('-_id slug name nameEn description')
    .sort({ name: 1 })
    .lean();
}

/** Permanently delete a report and its media objects (GDPR erasure / retention). */
export async function hardDeleteReport(id: string) {
  const media = await MediaAsset.find({ reportId: id });
  await Promise.allSettled(
    media.flatMap((m) => [
      deleteObject(m.storageKey, m.kind === MediaKind.VIDEO ? 'video' : 'image'),
      m.processedKey ? deleteObject(m.processedKey, 'image') : Promise.resolve(),
    ]),
  );
  // Cascade the dependent collections (Prisma did this via onDelete: Cascade).
  await Promise.all([
    MediaAsset.deleteMany({ reportId: id }),
    AiAnalysis.deleteMany({ reportId: id }),
    ConsentRecord.deleteMany({ reportId: id }),
  ]);
  await Report.deleteOne({ _id: id });
}

/**
 * A citizen permanently deletes their OWN report (and its media). Anonymous
 * reports have no owner, so they can only be removed by staff via the admin path.
 */
export async function deleteMyReport(
  reportId: string,
  user: { id: string },
  req: import('express').Request,
) {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found');
  if (report.reporterId !== user.id) throw ApiError.forbidden();

  await recordAudit({
    action: AuditAction.REPORT_DELETED,
    actorId: user.id,
    reportId,
    metadata: { status: report.status, deletedByReporter: true },
    req,
  });

  await hardDeleteReport(reportId);
}
