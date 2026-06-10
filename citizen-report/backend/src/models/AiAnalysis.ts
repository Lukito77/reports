import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { stringId, applyBaseConfig } from './_shared';
import { AiAnalysisType } from './enums';

/** Results of AI-assisted analysis. Advisory only — never an enforcement decision. */
export interface IAiAnalysis {
  _id: string;
  reportId: string;
  mediaId: string | null;
  type: AiAnalysisType;
  // e.g. { plate: "<encrypted>", confidence: 0.82 } | { tampered: false, score: 0.04 }
  result: unknown;
  confidence: number | null;
  provider: string | null;
  createdAt: Date;
}

export type AiAnalysisDocument = HydratedDocument<IAiAnalysis>;

const AiAnalysisSchema = new Schema<IAiAnalysis>(
  {
    ...stringId,
    reportId: { type: String, ref: 'Report', required: true, index: true },
    mediaId: { type: String, ref: 'MediaAsset', default: null },
    type: { type: String, enum: Object.values(AiAnalysisType), required: true, index: true },
    result: { type: Schema.Types.Mixed, required: true },
    confidence: { type: Number, default: null },
    provider: { type: String, default: null },
  },
);
applyBaseConfig(AiAnalysisSchema, { createdAt: true, updatedAt: false });

export const AiAnalysis: Model<IAiAnalysis> =
  (models.AiAnalysis as Model<IAiAnalysis>) ||
  model<IAiAnalysis>('AiAnalysis', AiAnalysisSchema);
