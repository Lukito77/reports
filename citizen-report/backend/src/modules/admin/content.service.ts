/**
 * Editable site copy. The admin lists/edits rows; the public site fetches the
 * same rows and merges them over the static i18n defaults.
 */
import { Content, AuditAction } from '../../models';
import type { IContent } from '../../models';
import { ContentType } from '../../models/enums';
import { ApiError } from '../../middleware/error';
import { recordAudit } from '../../lib/audit';
import type { Request } from 'express';

export async function listContent() {
  const items = await Content.find().sort({ group: 1, order: 1, key: 1 });
  return { items: items.map((i) => i.toObject()) };
}

interface CreateInput {
  key: string;
  group: string;
  label?: string;
  type?: ContentType;
  valueKa?: string;
  valueEn?: string;
  order?: number;
}

export async function createContent(input: CreateInput, actorId: string, req: Request) {
  const exists = await Content.findOne({ key: input.key });
  if (exists) throw ApiError.conflict('A content key with this name already exists');
  const doc = await Content.create(input);
  await recordAudit({
    action: AuditAction.CONTENT_UPDATED,
    actorId,
    metadata: { key: input.key, op: 'create' },
    req,
  });
  return doc.toObject() as unknown as IContent;
}

export async function updateContent(
  id: string,
  patch: Partial<CreateInput>,
  actorId: string,
  req: Request,
) {
  const updated = await Content.findByIdAndUpdate(id, { $set: patch }, { new: true });
  if (!updated) throw ApiError.notFound('Content not found');
  await recordAudit({
    action: AuditAction.CONTENT_UPDATED,
    actorId,
    metadata: { key: updated.key, op: 'update' },
    req,
  });
  return updated.toObject() as unknown as IContent;
}

export async function deleteContent(id: string, actorId: string, req: Request) {
  const doc = await Content.findById(id);
  if (!doc) throw ApiError.notFound('Content not found');
  await recordAudit({
    action: AuditAction.CONTENT_UPDATED,
    actorId,
    metadata: { key: doc.key, op: 'delete' },
    req,
  });
  await Content.deleteOne({ _id: id });
}

/**
 * Public shape: two locale trees keyed by the dotted content key, ready for the
 * frontend to deep-merge over its static translations.
 * e.g. { ka: { home: { title: '...' } }, en: { ... } }
 */
export async function publicContent() {
  const items = await Content.find().select('key valueKa valueEn');
  const ka: Record<string, unknown> = {};
  const en: Record<string, unknown> = {};
  for (const item of items) {
    setDeep(ka, item.key, item.valueKa);
    setDeep(en, item.key, item.valueEn);
  }
  return { ka, en };
}

function setDeep(target: Record<string, unknown>, dottedKey: string, value: unknown) {
  const parts = dottedKey.split('.');
  let node = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof node[p] !== 'object' || node[p] === null) node[p] = {};
    node = node[p] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}
