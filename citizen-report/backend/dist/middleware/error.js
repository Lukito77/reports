"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../lib/logger");
class ApiError extends Error {
    status;
    code;
    details;
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
    static badRequest(msg, details) {
        return new ApiError(400, 'BAD_REQUEST', msg, details);
    }
    static unauthorized(msg = 'Authentication required') {
        return new ApiError(401, 'UNAUTHORIZED', msg);
    }
    static forbidden(msg = 'Insufficient permissions') {
        return new ApiError(403, 'FORBIDDEN', msg);
    }
    static notFound(msg = 'Resource not found') {
        return new ApiError(404, 'NOT_FOUND', msg);
    }
    static conflict(msg) {
        return new ApiError(409, 'CONFLICT', msg);
    }
    static tooLarge(msg = 'Payload too large') {
        return new ApiError(413, 'PAYLOAD_TOO_LARGE', msg);
    }
}
exports.ApiError = ApiError;
function notFoundHandler(_req, res) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: err.flatten() },
        });
    }
    if (err instanceof ApiError) {
        return res
            .status(err.status)
            .json({ error: { code: err.code, message: err.message, details: err.details } });
    }
    // Multer file-size errors
    if (err && typeof err === 'object' && err.code === 'LIMIT_FILE_SIZE') {
        return res
            .status(413)
            .json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Uploaded file is too large' } });
    }
    logger_1.logger.error({ err }, 'Unhandled error');
    return res
        .status(500)
        .json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
//# sourceMappingURL=error.js.map