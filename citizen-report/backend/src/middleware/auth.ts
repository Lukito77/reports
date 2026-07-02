/**
 * Authentication & authorization middleware.
 * - requireAuth: verifies the Bearer access token and that tokenVersion matches.
 * - optionalAuth: attaches the user if a valid token is present, else continues.
 * - requireRole / requireVerified: coarse authorization guards.
 */
import { NextFunction, Request, Response } from 'express';
import { Role, User } from '../models';
import { Permission, effectivePermissions } from '../models/enums';
import { verifyAccessToken } from '../lib/jwt';
import { ApiError } from './error';

export interface AuthUser {
  id: string;
  role: Role;
  emailVerified: boolean;
  permissions: Permission[];
}

// @types/passport already declares `Request.user?: Express.User`, so we merge
// our auth shape into Express.User instead of re-declaring Request.user
// (re-declaring it loses our fields and breaks req.user.id/role/emailVerified).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends AuthUser {}
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function resolveUser(token: string): Promise<AuthUser | null> {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return null;
  }
  const user = await User.findById(payload.sub).select(
    'role permissions emailVerified tokenVersion',
  );
  // Reject tokens issued before the latest tokenVersion bump (logout/pw change).
  if (!user || user.tokenVersion !== payload.tv) return null;
  return {
    id: user.id,
    role: user.role,
    emailVerified: user.emailVerified,
    permissions: effectivePermissions(user.role, user.permissions),
  };
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized());
  const user = await resolveUser(token);
  if (!user) return next(ApiError.unauthorized('Invalid or expired token'));
  req.user = user;
  next();
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const user = await resolveUser(token);
    if (user) req.user = user;
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}

/**
 * Passes if the user holds ANY of the listed permissions. ADMIN always passes
 * (it implicitly holds every permission via `effectivePermissions`).
 */
export function requirePermission(...perms: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === Role.ADMIN) return next();
    const held = req.user.permissions ?? [];
    if (perms.some((p) => held.includes(p))) return next();
    next(ApiError.forbidden());
  };
}

export function requireVerified(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());
  if (!req.user.emailVerified)
    return next(ApiError.forbidden('Email verification required for this action'));
  next();
}
