import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { stringId, applyBaseConfig } from './_shared';
import { ContentType } from './enums';

/**
 * Editable site copy. Each document is one bilingual string identified by a
 * dotted `key` that mirrors the i18n path (e.g. `home.title`, `footer.disclaimer`).
 * The public site fetches all rows and deep-merges them over the static i18n
 * defaults, so editing a row here changes the live page without a redeploy.
 */
export interface IContent {
  _id: string;
  key: string; // dotted path, e.g. "home.title"
  group: string; // page/section bucket for the editor, e.g. "home"
  label: string; // human label shown in the editor
  type: ContentType;
  valueKa: string;
  valueEn: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentDocument = HydratedDocument<IContent>;

const ContentSchema = new Schema<IContent>({
  ...stringId,
  key: { type: String, required: true, unique: true },
  group: { type: String, required: true, index: true },
  label: { type: String, default: '' },
  type: { type: String, enum: Object.values(ContentType), default: ContentType.TEXT },
  valueKa: { type: String, default: '' },
  valueEn: { type: String, default: '' },
  order: { type: Number, default: 0 },
});
applyBaseConfig(ContentSchema, true);

export const Content: Model<IContent> =
  (models.Content as Model<IContent>) || model<IContent>('Content', ContentSchema);
