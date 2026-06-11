import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { stringId, applyBaseConfig } from './_shared';
import { Role } from './enums';

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  role: Role;
  emailVerified: boolean;
  // Bumping this invalidates all previously issued access tokens.
  tokenVersion: number;
  verifyToken: string | null;
  verifyTokenExpiry: Date | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
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
    emailVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    verifyToken: { type: String, default: null },
    verifyTokenExpiry: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
);
applyBaseConfig(UserSchema, true);

// Unique but nullable -> sparse so many users can have null tokens simultaneously.
UserSchema.index({ verifyToken: 1 }, { unique: true, sparse: true });
UserSchema.index({ resetToken: 1 }, { unique: true, sparse: true });

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>('User', UserSchema);

// 👇 ეს ხაზი აიძულებს Mongoose-ს წაშალოს ძველი, არასწორი ინდექსები ბაზიდან ჩართვისას
User.cleanIndexes().catch(err => console.log("Index cleanup info:", err));