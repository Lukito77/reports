import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { stringId, applyBaseConfig } from './_shared';
import { ReportStatus } from './enums';

export interface IReport {
  _id: string;
  // Null when submitted anonymously.
  reporterId: string | null;
  anonymous: boolean;
  // Optional encrypted contact for anonymous reporters who opt to be reachable.
  contactEnc: string | null;
  categoryId: string;
  status: ReportStatus;
  description: string;
  // AI-generated short summary (assistive only).
  summary: string | null;
  // Location.
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  // When the incident occurred (may differ from submission time / EXIF derived).
  incidentAt: Date | null;
  // Privacy / moderation.
  consentGiven: boolean;
  // Note left for the reporter when status == INFO_REQUESTED.
  reviewerNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ReportDocument = HydratedDocument<IReport>;

const ReportSchema = new Schema<IReport>(
  {
    ...stringId,
    reporterId: { type: String, ref: 'User', default: null, index: true },
    anonymous: { type: Boolean, default: false },
    contactEnc: { type: String, default: null },
    categoryId: { type: String, ref: 'Category', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.SUBMITTED,
      index: true,
    },
    description: { type: String, required: true },
    summary: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: null },
    incidentAt: { type: Date, default: null },
    consentGiven: { type: Boolean, default: false },
    reviewerNote: { type: String, default: null },
  },
);
applyBaseConfig(ReportSchema, true);

ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ latitude: 1, longitude: 1 });

// Relation virtuals so service code can `.populate('category')` / `.populate('reporter')`
// and read `report.category` / `report.reporter` just like the old Prisma relations.
ReportSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});
ReportSchema.virtual('reporter', {
  ref: 'User',
  localField: 'reporterId',
  foreignField: '_id',
  justOne: true,
});

export const Report: Model<IReport> =
  (models.Report as Model<IReport>) || model<IReport>('Report', ReportSchema);
