import { Request, Response } from 'express';
import { env, isProd } from '../../config/env';
import * as authService from './auth.service';

const REFRESH_COOKIE = 'crp_refresh';

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE || isProd,
    sameSite: 'strict',
    domain: env.COOKIE_DOMAIN,
    path: '/api/auth',
    expires: expiresAt,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth', domain: env.COOKIE_DOMAIN });
}

function reqMeta(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent']?.toString() };
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
