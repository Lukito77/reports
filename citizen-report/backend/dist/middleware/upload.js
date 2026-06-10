"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.ALLOWED_VIDEO_MIME = exports.ALLOWED_IMAGE_MIME = void 0;
exports.assertRealFileType = assertRealFileType;
/**
 * Secure file upload handling.
 * - Memory storage (we re-process & forward to S3; nothing hits local disk).
 * - Hard size cap and per-request file count cap.
 * - MIME allow-list at the multer layer; magic-byte verification happens later
 *   in the report service via `assertRealFileType` (defeats disguised files).
 */
const multer_1 = __importDefault(require("multer"));
// file-type@16 exposes `fromBuffer` (v17+ is ESM-only and incompatible with CommonJS).
const file_type_1 = require("file-type");
const env_1 = require("../config/env");
const error_1 = require("./error");
exports.ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
exports.ALLOWED_VIDEO_MIME = ['video/mp4'];
const ALLOWED = [...exports.ALLOWED_IMAGE_MIME, ...exports.ALLOWED_VIDEO_MIME];
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: env_1.env.MAX_UPLOAD_MB * 1024 * 1024,
        files: env_1.env.MAX_FILES_PER_REPORT,
    },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED.includes(file.mimetype)) {
            return cb(error_1.ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
        }
        cb(null, true);
    },
});
/**
 * Verifies the *actual* bytes match an allowed type. The client-declared MIME
 * cannot be trusted; this sniffs the file signature.
 * @returns the detected mime, or throws ApiError.
 */
async function assertRealFileType(buffer, declaredMime) {
    const detected = await (0, file_type_1.fromBuffer)(buffer);
    if (!detected || !ALLOWED.includes(detected.mime)) {
        throw error_1.ApiError.badRequest('File content does not match an allowed media type');
    }
    // Image family must stay image; video must stay video.
    const declaredIsImage = exports.ALLOWED_IMAGE_MIME.includes(declaredMime);
    const detectedIsImage = exports.ALLOWED_IMAGE_MIME.includes(detected.mime);
    if (declaredIsImage !== detectedIsImage) {
        throw error_1.ApiError.badRequest('Declared and actual file types disagree');
    }
    return detected.mime;
}
//# sourceMappingURL=upload.js.map