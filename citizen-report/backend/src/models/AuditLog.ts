import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { stringId, applyBaseConfig } from './_shared';
import { AuditAction } from './enums';

/** Append-only audit trail of administrative actions. */
export interface IAuditLog {
  _id: string;
  action: AuditAction;
  actorId: string | null;
  reportId: string | null;
  // Structured before/after state and metadata.
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export type AuditLogDocument = HydratedDocument<IAuditLog>;

const AuditLogSchema = new Schema<IAuditLog>(
  {
    ...stringId,
    action: { type: String, enum: Object.values(AuditAction), required: true, index: true },
    actorId: { type: String, ref: 'User', default: null, index: true },
    reportId: { type: String, ref: 'Report', default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
);
applyBaseConfig(AuditLogSchema, { createdAt: true, updatedAt: false });

AuditLogSchema.index({ createdAt: -1 });

// Lets `listAuditLogs` populate the acting user.
AuditLogSchema.virtual('actor', {
  ref: 'User',
  localField: 'actorId',
  foreignField: '_id',
  justOne: true,
});

export const AuditLog: Model<IAuditLog> =
  (models.AuditLog as Model<IAuditLog>) || model<IAuditLog>('AuditLog', AuditLogSchema);
