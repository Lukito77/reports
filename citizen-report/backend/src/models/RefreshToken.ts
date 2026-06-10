import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { stringId, applyBaseConfig } from './_shared';

/**
 * Rotating refresh tokens. The raw token is never stored — only its hash.
 * Tokens issued from the same login share a `family`; reuse detection revokes
 * the whole family.
 */
export interface IRefreshToken {
  _id: string;
  userId: string;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  revokedAt: Date | null;
  // Set when this token is rotated, pointing at its successor (reuse detection).
  replacedBy: string | null;
  createdByIp: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export type RefreshTokenDocument = HydratedDocument<IRefreshToken>;

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    ...stringId,
    userId: { type: String, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
    createdByIp: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
);
applyBaseConfig(RefreshTokenSchema, { createdAt: true, updatedAt: false });

export const RefreshToken: Model<IRefreshToken> =
  (models.RefreshToken as Model<IRefreshToken>) ||
  model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
