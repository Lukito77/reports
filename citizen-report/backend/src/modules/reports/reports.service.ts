/**
 * Report domain logic: secure media ingestion (type sniffing, EXIF GPS
 * extraction, face blurring, tamper detection, integrity hashing), persistence,
 * and reader access with signed media URLs.
 */
import crypto from 'crypto';
import exifr from 'exifr';
import sharp from 'sharp';
import { MediaKind, Prisma, ReportStatus, Role, AuditAction } from '@prisma/client';
import { prisma } from '../../lib/prisma';
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
    const blurred = await ai.blurFaces(file.buffer);
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

  const category = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
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

  const report = await prisma.report.create({
    data: {
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
      media: {
        create: ingested.map((m) => ({
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
      },
      consent: {
        create: {
          policyVersion: input.policyVersion,
          consentText: input.consentText ?? 'Standard consent notice accepted.',
          ip: ctx.ip,
          userAgent: ctx.userAgent?.slice(0, 512),
        },
      },
    },
    include: { media: true, category: true },
  });

  // Persist AI analyses (advisory).
  const aiRows: Prisma.AiAnalysisCreateManyInput[] = [];
  report.media.forEach((dbMedia, i) => {
    const m = ingested[i];
    if (m.ai.plates && m.ai.plates.plates.length > 0) {
      aiRows.push({
        reportId: report.id,
        mediaId: dbMedia.id,
        type: 'PLATE_OCR',
        result: m.ai.plates.plates as unknown as Prisma.InputJsonValue,
        provider: m.ai.plates.provider,
      });
    }
    if (m.ai.tamper) {
      aiRows.push({
        reportId: report.id,
        mediaId: dbMedia.id,
        type: 'TAMPER_DETECTION',
        result: m.ai.tamper as unknown as Prisma.InputJsonValue,
        confidence: m.ai.tamper.score,
        provider: m.ai.tamper.provider,
      });
    }
    if (m.ai.facesBlurred != null) {
      aiRows.push({
        reportId: report.id,
        mediaId: dbMedia.id,
        type: 'FACE_BLUR',
        result: { facesBlurred: m.ai.facesBlurred } as Prisma.InputJsonValue,
      });
    }
  });
  aiRows.push({
    reportId: report.id,
    type: 'SUMMARY',
    result: { summary } as Prisma.InputJsonValue,
  });
  if (aiRows.length) await prisma.aiAnalysis.createMany({ data: aiRows });

  await recordAudit({
    action: AuditAction.REPORT_CREATED,
    actorId: ctx.userId ?? null,
    reportId: report.id,
    metadata: { anonymous, category: category.slug, mediaCount: ingested.length },
  });

  return sanitizeReport(report);
}

/** Strip sensitive fields from a report before returning to a citizen. */
function sanitizeReport(report: { contactEnc?: string | null; [k: string]: unknown }) {
  const { contactEnc, ...rest } = report;
  return rest;
}

export async function listMyReports(
  userId: string,
  opts: { status?: ReportStatus; page: number; pageSize: number },
) {
  const where: Prisma.ReportWhereInput = { reporterId: userId };
  if (opts.status) where.status = opts.status;

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      include: { category: true, media: { select: { id: true, kind: true } } },
    }),
    prisma.report.count({ where }),
  ]);

  return { items: items.map(sanitizeReport), total, page: opts.page, pageSize: opts.pageSize };
}

/**
 * Fetch a single report. Citizens may only read their own; moderators/admins any.
 * Returns signed URLs for the privacy-processed media (originals only to staff).
 */
export async function getReport(
  id: string,
  viewer: { id: string; role: Role },
) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: { category: true, media: true, aiAnalyses: true },
  });
  if (!report) throw ApiError.notFound('Report not found');

  const isStaff = viewer.role === Role.ADMIN || viewer.role === Role.MODERATOR;
  if (!isStaff && report.reporterId !== viewer.id) throw ApiError.forbidden();

  // Build signed URLs. Citizens see only the processed (blurred) derivative.
  const media = await Promise.all(
    report.media.map(async (m) => {
      const viewKey = isStaff ? m.storageKey : m.processedKey ?? m.storageKey;
      return {
        id: m.id,
        kind: m.kind,
        mimeType: m.mimeType,
        width: m.width,
        height: m.height,
        exifLat: isStaff ? m.exifLat : undefined,
        exifLng: isStaff ? m.exifLng : undefined,
        exifTakenAt: m.exifTakenAt,
        url: await getSignedDownloadUrl(viewKey),
      };
    }),
  );

  // Decrypt plate text only for staff.
  const aiAnalyses = report.aiAnalyses.map((a) => {
    if (a.type === 'PLATE_OCR' && isStaff && Array.isArray(a.result)) {
      const plates = (a.result as { textEncrypted: string; confidence: number }[]).map((p) => ({
        text: decrypt(p.textEncrypted),
        confidence: p.confidence,
      }));
      return { ...a, result: plates };
    }
    if (a.type === 'PLATE_OCR' && !isStaff) {
      return { ...a, result: { redacted: true } };
    }
    return a;
  });

  return { ...sanitizeReport(report), media, aiAnalyses };
}

/** Public list of categories for the submission form. */
export function listCategories() {
  return prisma.category.findMany({
    where: { active: true },
    select: { slug: true, name: true, description: true },
    orderBy: { name: 'asc' },
  });
}

/** Permanently delete a report and its media objects (GDPR erasure / retention). */
export async function hardDeleteReport(id: string) {
  const media = await prisma.mediaAsset.findMany({ where: { reportId: id } });
  await Promise.allSettled(
    media.flatMap((m) => [
      deleteObject(m.storageKey),
      m.processedKey ? deleteObject(m.processedKey) : Promise.resolve(),
    ]),
  );
  await prisma.report.delete({ where: { id } });
}
