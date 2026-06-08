/**
 * Centralized error handling. Domain code throws `ApiError`; everything else is
 * treated as an unexpected 500 (details hidden from the client).
 */
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(msg: string, details?: unknown) {
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
  static conflict(msg: string) {
    return new ApiError(409, 'CONFLICT', msg);
  }
  static tooLarge(msg = 'Payload too large') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', msg);
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
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
  if (err && typeof err === 'object' && (err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
    return res
      .status(413)
      .json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Uploaded file is too large' } });
  }

  logger.error({ err }, 'Unhandled error');
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
