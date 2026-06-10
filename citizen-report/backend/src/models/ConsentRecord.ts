import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { stringId, applyBaseConfig } from './_shared';

/** Immutable record of the consent shown to and accepted by a reporter (GDPR). */
export interface IConsentRecord {
  _id: string;
  reportId: string;
  policyVersion: string;
  consentText: string;
  ip: string | null;
  userAgent: string | null;
  acceptedAt: Date;
}

export type ConsentRecordDocument = HydratedDocument<IConsentRecord>;

const ConsentRecordSchema = new Schema<IConsentRecord>(
  {
    ...stringId,
    reportId: { type: String, ref: 'Report', required: true, unique: true },
    policyVersion: { type: String, required: true },
    consentText: { type: String, required: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    acceptedAt: { type: Date, default: () => new Date() },
  },
);
// acceptedAt is managed explicitly; no createdAt/updatedAt.
applyBaseConfig(ConsentRecordSchema, false);

export const ConsentRecord: Model<IConsentRecord> =
  (models.ConsentRecord as Model<IConsentRecord>) ||
  model<IConsentRecord>('ConsentRecord', ConsentRecordSchema);
