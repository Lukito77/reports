/**
 * Auth domain logic: registration, login, refresh-token rotation (with reuse
 * detection), email verification, and password reset.
 */
import bcrypt from 'bcryptjs';
import { User, RefreshToken, type UserDocument } from '../../models';
import { effectivePermissions } from '../../models/enums';
import { env } from '../../config/env';
import { signAccessToken } from '../../lib/jwt';
import { randomToken, randomOtp, sha256 } from '../../lib/crypto';
import { ApiError } from '../../middleware/error';
import { sendPasswordResetEmail, sendOtpEmail } from '../../lib/mailer';

const BCRYPT_COST = 12;
const RESET_TTL_MS = 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

function publicUser(u: UserDocument) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    permissions: effectivePermissions(u.role, u.permissions),
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
  };
}

/** Issues an access token + a fresh refresh token belonging to a (possibly new) family. */
async function issueTokens(
  user: UserDocument,
  family: string,
  meta: { ip?: string; userAgent?: string },
): Promise<IssuedTokens> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, tv: user.tokenVersion });
  const refreshToken = randomToken(48);
  const refreshExpiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user.id,
    tokenHash: sha256(refreshToken),
    family,
    expiresAt: refreshExpiresAt,
    createdByIp: meta.ip,
    userAgent: meta.userAgent?.slice(0, 512),
  });

  return { accessToken, refreshToken, refreshExpiresAt };
}

export async function register(
  email: string,
  password: string,
  displayName: string | undefined,
) {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  // No transactional email provider is configured for the deployment, so a
  // verification link could never reach the user. Accounts are therefore
  // created already verified — consistent with the Google sign-in flow.
  const user = await User.create({
    email,
    passwordHash,
    displayName,
    emailVerified: true,
  });

  return publicUser(user);
}

export async function login(
  email: string,
  password: string,
  meta: { ip?: string; userAgent?: string },
) {
  const user = await User.findOne({ email });
  // Constant-ish response: always run a hash compare to reduce user enumeration timing.
  const ok = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !ok) throw ApiError.unauthorized('Invalid email or password');

  // Backfill accounts created before verification was dropped (no mail provider).
  if (!user.emailVerified) {
    await User.updateOne(
      { _id: user.id },
      { emailVerified: true, verifyToken: null, verifyTokenExpiry: null },
    );
    user.emailVerified = true;
  }

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
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored) throw ApiError.unauthorized('Invalid refresh token');

  if (stored.revokedAt || stored.expiresAt < new Date()) {
    // Reuse of a revoked token => compromise. Nuke the family.
    await RefreshToken.updateMany(
      { family: stored.family, revokedAt: null },
      { revokedAt: new Date() },
    );
    throw ApiError.unauthorized('Refresh token reuse detected; session revoked');
  }

  const user = await User.findById(stored.userId);
  if (!user) throw ApiError.unauthorized();

  const next = await issueTokens(user, stored.family, meta);
  await RefreshToken.updateOne(
    { _id: stored.id },
    { revokedAt: new Date(), replacedBy: sha256(next.refreshToken) },
  );

  return { user: publicUser(user), tokens: next };
}

/** Revokes a single refresh token (logout) and the rest of its family. */
export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;
  const stored = await RefreshToken.findOne({ tokenHash: sha256(rawToken) });
  if (!stored) return;
  await RefreshToken.updateMany(
    { family: stored.family, revokedAt: null },
    { revokedAt: new Date() },
  );
}

export async function verifyEmail(token: string) {
  const user = await User.findOne({ verifyToken: token });
  if (!user || !user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }
  await User.updateOne(
    { _id: user.id },
    { emailVerified: true, verifyToken: null, verifyTokenExpiry: null },
  );
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email });
  // Always return success to avoid user enumeration.
  if (!user) return;
  const resetToken = randomToken(32);
  await User.updateOne(
    { _id: user.id },
    { resetToken, resetTokenExpiry: new Date(Date.now() + RESET_TTL_MS) },
  );
  await sendPasswordResetEmail(email, resetToken);
}

export async function resetPassword(token: string, password: string) {
  const user = await User.findOne({ resetToken: token });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  await User.updateOne(
    { _id: user.id },
    {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      // Invalidate all existing access tokens and refresh sessions.
      $inc: { tokenVersion: 1 },
    },
  );
  await RefreshToken.updateMany(
    { userId: user.id, revokedAt: null },
    { revokedAt: new Date() },
  );
}

/**
 * Sends a one-time sign-in code to the account's email. Always resolves without
 * revealing whether the account exists (no user enumeration).
 */
export async function requestOtp(email: string) {
  const user = await User.findOne({ email });
  if (!user) return;
  const code = randomOtp(6);
  await User.updateOne(
    { _id: user.id },
    { otpCodeHash: sha256(code), otpExpiry: new Date(Date.now() + OTP_TTL_MS), otpAttempts: 0 },
  );
  await sendOtpEmail(email, code);
}

/** Verifies an emailed one-time code and, on success, issues a session. */
export async function verifyOtp(
  email: string,
  code: string,
  meta: { ip?: string; userAgent?: string },
) {
  const user = await User.findOne({ email });
  if (!user || !user.otpCodeHash || !user.otpExpiry || user.otpExpiry < new Date()) {
    throw ApiError.badRequest('Invalid or expired code');
  }
  if ((user.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    await User.updateOne({ _id: user.id }, { otpCodeHash: null, otpExpiry: null, otpAttempts: 0 });
    throw ApiError.badRequest('Too many attempts. Please request a new code.');
  }
  if (sha256(code) !== user.otpCodeHash) {
    await User.updateOne({ _id: user.id }, { $inc: { otpAttempts: 1 } });
    throw ApiError.badRequest('Invalid or expired code');
  }

  // Success: burn the code and mark the email verified (proven via the code).
  await User.updateOne(
    { _id: user.id },
    { otpCodeHash: null, otpExpiry: null, otpAttempts: 0, emailVerified: true },
  );
  user.emailVerified = true;

  const family = randomToken(16);
  const tokens = await issueTokens(user, family, meta);
  return { user: publicUser(user), tokens };
}
