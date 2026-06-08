/**
 * Auth domain logic: registration, login, refresh-token rotation (with reuse
 * detection), email verification, and password reset.
 */
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { signAccessToken } from '../../lib/jwt';
import { randomToken, sha256 } from '../../lib/crypto';
import { ApiError } from '../../middleware/error';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../lib/mailer';

const BCRYPT_COST = 12;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
  };
}

/** Issues an access token + a fresh refresh token belonging to a (possibly new) family. */
async function issueTokens(
  user: User,
  family: string,
  meta: { ip?: string; userAgent?: string },
): Promise<IssuedTokens> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, tv: user.tokenVersion });
  const refreshToken = randomToken(48);
  const refreshExpiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      family,
      expiresAt: refreshExpiresAt,
      createdByIp: meta.ip,
      userAgent: meta.userAgent?.slice(0, 512),
    },
  });

  return { accessToken, refreshToken, refreshExpiresAt };
}

export async function register(
  email: string,
  password: string,
  displayName: string | undefined,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const verifyToken = randomToken(32);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      verifyToken,
      verifyTokenExpiry: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });

  await sendVerificationEmail(email, verifyToken);
  return publicUser(user);
}

export async function login(
  email: string,
  password: string,
  meta: { ip?: string; userAgent?: string },
) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-ish response: always run a hash compare to reduce user enumeration timing.
  const ok = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !ok) throw ApiError.unauthorized('Invalid email or password');

  const family = randomToken(16);
  const tokens = await issueTokens(user, family, meta);
  return { user: publicUser(user), tokens };
}

/**
 * Rotates a refresh token. If a previously-rotated (revoked) token is presented,
 * we treat it as theft and revoke the whole family.
 */
export async function refresh(
  rawToken: string,
  meta: { ip?: string; userAgent?: string },
) {
  const tokenHash = sha256(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored) throw ApiError.unauthorized('Invalid refresh token');

  if (stored.revokedAt || stored.expiresAt < new Date()) {
    // Reuse of a revoked token => compromise. Nuke the family.
    await prisma.refreshToken.updateMany({
      where: { family: stored.family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthorized('Refresh token reuse detected; session revoked');
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw ApiError.unauthorized();

  const next = await issueTokens(user, stored.family, meta);
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedBy: sha256(next.refreshToken) },
  });

  return { user: publicUser(user), tokens: next };
}

/** Revokes a single refresh token (logout) and the rest of its family. */
export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
  if (!stored) return;
  await prisma.refreshToken.updateMany({
    where: { family: stored.family, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findUnique({ where: { verifyToken: token } });
  if (!user || !user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verifyToken: null, verifyTokenExpiry: null },
  });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to avoid user enumeration.
  if (!user) return;
  const resetToken = randomToken(32);
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry: new Date(Date.now() + RESET_TTL_MS) },
  });
  await sendPasswordResetEmail(email, resetToken);
}

export async function resetPassword(token: string, password: string) {
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      // Invalidate all existing access tokens and refresh sessions.
      tokenVersion: { increment: 1 },
    },
  });
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
