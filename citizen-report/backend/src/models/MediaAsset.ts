import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { stringId, applyBaseConfig } from './_shared';
import { MediaKind } from './enums';

export interface IMediaAsset {
  _id: string;
  reportId: string;
  kind: MediaKind;
  // Cloudinary public_id of the original (random UUID, no original filename).
  storageKey: string;
  // Public_id of the privacy-processed (face-blurred) derivative shown to reviewers.
  processedKey: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  // GPS extracted from EXIF, if present.
  exifLat: number | null;
  exifLng: number | null;
  exifTakenAt: Date | null;
  // SHA-256 of the original bytes (integrity / dedupe / tamper baseline).
  sha256: string | null;
  createdAt: Date;
}

export type MediaAssetDocument = HydratedDocument<IMediaAsset>;

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    ...stringId,
    reportId: { type: String, ref: 'Report', required: true, index: true },
    kind: { type: String, enum: Object.values(MediaKind), required: true },
    storageKey: { type: String, required: true, unique: true },
    processedKey: { type: String, default: null },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    exifLat: { type: Number, default: null },
    exifLng: { type: Number, default: null },
    exifTakenAt: { type: Date, default: null },
    sha256: { type: String, default: null },
  },
);
applyBaseConfig(MediaAssetSchema, { createdAt: true, updatedAt: false });

export const MediaAsset: Model<IMediaAsset> =
  (models.MediaAsset as Model<IMediaAsset>) ||
  model<IMediaAsset>('MediaAsset', MediaAssetSchema);
