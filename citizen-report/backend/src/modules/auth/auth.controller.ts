import { Request, Response } from 'express';
import { env, isProd } from '../../config/env';
import * as authService from './auth.service';
import { User, RefreshToken } from '../../models'; // წამოიღებს მოდელებს შენი პროექტიდან
import crypto from 'crypto';
import { signAccessToken } from '../../lib/jwt';

const REFRESH_COOKIE = 'crp_refresh';

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd, // პროდაქშენზე (Vercel) იქნება true
    // ფრონტი და ბექი სხვადასხვა დომენზეა (citizen-report-frontend... / reports-cyan...),
    // ამიტომ პროდზე ქუქი მხოლოდ SameSite=None-ით გაიგზავნება cross-site fetch-ზე.
    sameSite: isProd ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/api/auth',
    expires: expiresAt,
  });
}

function clearRefreshCookie(res: Response) {
  // წაშლის Set-Cookie-ს ბრაუზერი მხოლოდ მაშინ იღებს, თუ ატრიბუტები
  // ზუსტად ემთხვევა იმას, რითაც ქუქი დაყენდა (განსაკუთრებით SameSite/Secure).
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/api/auth',
  });
}

function reqMeta(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent']?.toString() };
}

// ⚡ სრულად გამართული და ინტეგრირებული Google Auth ჰენდლერი
export async function handleGoogleAuthSuccess(req: Request, res: Response) {
  try {
    // passport-ის google strategy აქ აბრუნებს {email, name, googleId} ობიექტს
    const googleUser = req.user as unknown as { email?: string; name?: string } | undefined;
    if (!googleUser?.email) {
      return res.redirect(`${env.APP_BASE_URL}/login?error=no_user_data`);
    }

    const email = googleUser.email;
    const displayName = googleUser.name || 'Google User';

    // 1. ვეძებთ იუზერს ბაზაში
    let user = await User.findOne({ email });

    // თუ ანგარიში არსებობს, მაგრამ ემაილი ჯერ არ იყო ვერიფიცირებული —
    // Google-მა ეს ემაილი უკვე დაადასტურა, ამიტომ ვერიფიცირებულად ვთვლით
    if (user && !user.emailVerified) {
      await User.updateOne(
        { _id: user.id },
        { emailVerified: true, verifyToken: null, verifyTokenExpiry: null },
      );
      user.emailVerified = true;
    }

    // 2. თუ იუზერი არ არსებობს, ვქმნით ახალს
    if (!user) {
      // შემთხვევითი პაროლი — ამ ანგარიშით პაროლით შესვლა მაინც შეუძლებელი იქნება,
      // სანამ იუზერი reset-password-ით არ დააყენებს საკუთარს.
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await User.create({
        email,
        displayName,
        passwordHash: hashedPassword,
        emailVerified: true, // გუგლიდან შემოსული ავტომატურად ვერიფიცირებულია
      });
    }

    // 3. ტოკენების გენერაცია (ზუსტად ისე, როგორც auth.service აკეთებს)
    const accessToken = signAccessToken({ sub: user.id, role: user.role, tv: user.tokenVersion });

    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const family = crypto.randomBytes(16).toString('hex');

    // ვინახავთ რეფრეშ ტოკენს მონაცემთა ბაზაში
    await RefreshToken.create({
      userId: user.id,
      tokenHash: tokenHash,
      family: family,
      expiresAt: refreshExpiresAt,
      createdByIp: reqMeta(req).ip,
      userAgent: reqMeta(req).userAgent?.slice(0, 512),
    });

    // 4. ვსვამთ ქუქის ფრონტენდისთვის
    setRefreshCookie(res, rawRefreshToken, refreshExpiresAt);

    // 5. გადაგვყავს იუზერი ფრონტენდზე და ტოკენი მიგვაქვს URL-ით —
    // /login გვერდი ამ ტოკენს იჭერს, მეხსიერებაში სვამს და დეშბორდზე გადადის
    return res.redirect(`${env.APP_BASE_URL}/login?token=${encodeURIComponent(accessToken)}`);

  } catch (error) {
    console.error("Google Auth Controller Error:", error);
    return res.redirect(`${env.APP_BASE_URL}/login?error=server_error`);
  }
}

export async function register(req: Request, res: Response) {
  const { email, password, displayName } = req.body;
  const user = await authService.register(email, password, displayName);
  res.status(201).json({
    user,
    message: 'Registration successful. Check your email to verify your account.',
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login(email, password, reqMeta(req));
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
  res.json({ user, accessToken: tokens.accessToken });
}

export async function refresh(req: Request, res: Response) {
  const raw = req.cookies?.crp_refresh as string | undefined;
  if (!raw) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
  const { user, tokens } = await authService.refresh(raw, reqMeta(req));
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
  return res.json({ user, accessToken: tokens.accessToken });
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req.cookies?.crp_refresh);
  clearRefreshCookie(res);
  res.json({ message: 'Logged out' });
}

export async function verifyEmail(req: Request, res: Response) {
  await authService.verifyEmail(req.body.token);
  res.json({ message: 'Email verified. You can now sign in.' });
}

export async function forgotPassword(req: Request, res: Response) {
  await authService.forgotPassword(req.body.email);
  res.json({ message: 'If an account exists, a reset link has been sent.' });
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ message: 'Password updated. Please sign in.' });
}