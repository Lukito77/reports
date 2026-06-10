import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { stringId, applyBaseConfig } from './_shared';

export interface ICategory {
  _id: string;
  slug: string; // e.g. "illegal_parking"
  name: string; // e.g. "Illegal parking"
  description: string | null;
  active: boolean;
  createdAt: Date;
}

export type CategoryDocument = HydratedDocument<ICategory>;

const CategorySchema = new Schema<ICategory>(
  {
    ...stringId,
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
);
applyBaseConfig(CategorySchema, { createdAt: true, updatedAt: false });

export const Category: Model<ICategory> =
  (models.Category as Model<ICategory>) || model<ICategory>('Category', CategorySchema);
