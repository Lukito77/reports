/**
 * Secure file upload handling.
 * - Memory storage (we re-process & forward to S3; nothing hits local disk).
 * - Hard size cap and per-request file count cap.
 * - MIME allow-list at the multer layer; magic-byte verification happens later
 *   in the report service via `assertRealFileType` (defeats disguised files).
 */
import multer from 'multer';
// file-type@16 exposes `fromBuffer` (v17+ is ESM-only and incompatible with CommonJS).
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { env } from '../config/env';
import { ApiError } from './error';

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_MIME = ['video/mp4'];
const ALLOWED = [...ALLOWED_IMAGE_MIME, ...ALLOWED_VIDEO_MIME];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: env.MAX_FILES_PER_REPORT,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

/**
 * Verifies the *actual* bytes match an allowed type. The client-declared MIME
 * cannot be trusted; this sniffs the file signature.
 * @returns the detected mime, or throws ApiError.
 */
export async function assertRealFileType(buffer: Buffer, declaredMime: string): Promise<string> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED.includes(detected.mime)) {
    throw ApiError.badRequest('File content does not match an allowed media type');
  }
  // Image family must stay image; video must stay video.
  const declaredIsImage = ALLOWED_IMAGE_MIME.includes(declaredMime);
  const detectedIsImage = ALLOWED_IMAGE_MIME.includes(detected.mime);
  if (declaredIsImage !== detectedIsImage) {
    throw ApiError.badRequest('Declared and actual file types disagree');
  }
  return detected.mime;
}
