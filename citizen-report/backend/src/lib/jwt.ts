/**
 * JWT access-token helpers. Access tokens are short-lived and stateless; the
 * embedded `tv` (tokenVersion) lets us revoke all of a user's access tokens by
 * bumping their stored tokenVersion (e.g. on logout / password change).
 */
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../models/enums';

export interface AccessTokenPayload {
  sub: string; // user id
  role: Role;
  tv: number; // token version
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}
