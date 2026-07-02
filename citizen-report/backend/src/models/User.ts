import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { stringId, applyBaseConfig } from './_shared';
import { Role } from './enums';

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  role: Role;
  permissions: string[];
  emailVerified: boolean;
  tokenVersion: number;
  verifyToken: string | null;
  verifyTokenExpiry: Date | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  otpCodeHash: string | null;
  otpExpiry: Date | null;
  otpAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const UserSchema = new Schema<IUser>(
  {
    ...stringId,
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: null },
    role: { type: String, enum: Object.values(Role), default: Role.CITIZEN, index: true },
    permissions: { type: [String], default: [] },
    emailVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    verifyToken: { type: String, default: null },
    verifyTokenExpiry: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
    // Passwordless email one-time code (admin/passwordless sign-in).
    otpCodeHash: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
  },
);
applyBaseConfig(UserSchema, true);

// ⚡ მხოლოდ ჩვეულებრივი ინდექსები უნიკალურობის (unique) გარეშე, რათა null-ებზე არასდროს გაჭედოს
UserSchema.index({ verifyToken: 1 });
UserSchema.index({ resetToken: 1 });

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>('User', UserSchema);