/**
 * Shared Mongoose building blocks so every model behaves like the old Prisma
 * models did: a string UUID primary key exposed as `id` (never `_id`/`__v`),
 * and consistent JSON/object serialization including virtual relations.
 */
import { randomUUID } from 'crypto';
import type { Schema, SchemaOptions } from 'mongoose';

/** String UUID `_id` (matches Prisma's `@id @default(uuid())`). */
export const stringId = {
  _id: { type: String, default: () => randomUUID() },
} as const;

function stripId(_doc: unknown, ret: Record<string, unknown>) {
  ret.id = ret._id;
  delete ret._id;
  return ret;
}

/**
 * Applies the shared config to a schema: timestamps (per Prisma's per-model
 * declaration), no version key, and id-mapping serialization with virtuals so
 * populated relations (category/reporter/actor) and `id` surface in responses.
 * Set via `schema.set(...)` to avoid binding the constructor's doc-type generic.
 */
export function applyBaseConfig(schema: Schema, timestamps: SchemaOptions['timestamps']): void {
  schema.set('timestamps', timestamps);
  schema.set('versionKey', false);
  schema.set('toObject', { virtuals: true, transform: stripId });
  schema.set('toJSON', { virtuals: true, transform: stripId });
}
