/**
 * Generic, whitelisted CRUD over MongoDB collections for the admin data browser.
 *
 * Safety model:
 *  - Only collections in REGISTRY are reachable (no arbitrary collection names).
 *  - Sensitive fields are redacted from every response and rejected on write.
 *  - Some collections are read-only (e.g. the append-only audit log).
 *  - Every create/update/delete is audited.
 */
import type { Model } from 'mongoose';
import type { FilterQuery } from 'mongoose';
import {
  User,
  Category,
  Report,
  MediaAsset,
  AuditLog,
  AiAnalysis,
  ConsentRecord,
  RefreshToken,
  SiteSetting,
  Content,
  AuditAction,
} from '../../models';
import { ApiError } from '../../middleware/error';
import { recordAudit } from '../../lib/audit';
import type { Request } from 'express';

interface CollectionDef {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>;
  readOnly?: boolean;
  /** Fields stripped from responses and ignored on write. */
  redact: string[];
  /** Fields used for the free-text `q` search (regex, case-insensitive). */
  searchFields: string[];
}

// Fields that must never be created/updated through the generic editor or
// returned in responses, regardless of collection.
const ALWAYS_IMMUTABLE = ['_id', 'id', '__v', 'createdAt', 'updatedAt'];

const REGISTRY: Record<string, CollectionDef> = {
  users: {
    label: 'Users',
    model: User,
    redact: ['passwordHash', 'verifyToken', 'verifyTokenExpiry', 'resetToken', 'resetTokenExpiry'],
    searchFields: ['email', 'displayName'],
  },
  reports: {
    label: 'Reports',
    model: Report,
    redact: ['contactEnc'],
    searchFields: ['description', 'address'],
  },
  categories: {
    label: 'Categories',
    model: Category,
    redact: [],
    searchFields: ['slug', 'name', 'nameEn'],
  },
  content: {
    label: 'Content',
    model: Content,
    redact: [],
    searchFields: ['key', 'group', 'label'],
  },
  mediaAssets: {
    label: 'Media assets',
    model: MediaAsset,
    redact: [],
    searchFields: ['reportId', 'kind', 'mimeType'],
  },
  aiAnalyses: {
    label: 'AI analyses',
    model: AiAnalysis,
    redact: [],
    searchFields: ['reportId', 'type'],
  },
  consentRecords: {
    label: 'Consent records',
    model: ConsentRecord,
    redact: [],
    searchFields: ['reportId', 'type'],
  },
  siteSettings: {
    label: 'Site settings',
    model: SiteSetting,
    redact: [],
    searchFields: ['key'],
  },
  refreshTokens: {
    label: 'Refresh tokens',
    model: RefreshToken,
    readOnly: true,
    redact: ['tokenHash', 'replacedBy'],
    searchFields: ['userId', 'family'],
  },
  auditLogs: {
    label: 'Audit logs',
    model: AuditLog,
    readOnly: true,
    redact: [],
    searchFields: ['action', 'actorId', 'reportId', 'ip'],
  },
};

function def(name: string): CollectionDef {
  const d = REGISTRY[name];
  if (!d) throw ApiError.notFound(`Unknown collection: ${name}`);
  return d;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function redactDoc(obj: Record<string, unknown>, redact: string[]) {
  for (const f of redact) delete obj[f];
  return obj;
}

function sanitizeWrite(body: Record<string, unknown>, redact: string[]) {
  const clean: Record<string, unknown> = {};
  const blocked = new Set([...ALWAYS_IMMUTABLE, ...redact]);
  for (const [k, v] of Object.entries(body)) {
    if (blocked.has(k)) continue;
    clean[k] = v;
  }
  return clean;
}

export function listCollections() {
  return {
    collections: Object.entries(REGISTRY).map(([name, d]) => ({
      name,
      label: d.label,
      readOnly: !!d.readOnly,
    })),
  };
}

interface ListInput {
  q?: string;
  page: number;
  pageSize: number;
  sort?: string;
}

export async function listDocuments(name: string, f: ListInput) {
  const d = def(name);
  const where: FilterQuery<unknown> = {};
  if (f.q && d.searchFields.length) {
    const rx = { $regex: escapeRegex(f.q), $options: 'i' };
    (where as Record<string, unknown>).$or = d.searchFields.map((field) => ({ [field]: rx }));
  }

  // Sort: "field" asc or "-field" desc; default newest-ish by _id.
  const sort: Record<string, 1 | -1> = {};
  if (f.sort) {
    const desc = f.sort.startsWith('-');
    sort[desc ? f.sort.slice(1) : f.sort] = desc ? -1 : 1;
  } else {
    sort._id = -1;
  }

  const [docs, total] = await Promise.all([
    d.model
      .find(where)
      .sort(sort)
      .skip((f.page - 1) * f.pageSize)
      .limit(f.pageSize)
      .lean(),
    d.model.countDocuments(where),
  ]);

  const items = docs.map((doc) => {
    const obj = doc as Record<string, unknown>;
    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    return redactDoc(obj, d.redact);
  });

  return { items, total, page: f.page, pageSize: f.pageSize, readOnly: !!d.readOnly };
}

export async function getDocument(name: string, id: string) {
  const d = def(name);
  const doc = await d.model.findById(id).lean();
  if (!doc) throw ApiError.notFound('Document not found');
  const obj = doc as Record<string, unknown>;
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return { item: redactDoc(obj, d.redact) };
}

export async function createDocument(
  name: string,
  body: Record<string, unknown>,
  actorId: string,
  req: Request,
) {
  const d = def(name);
  if (d.readOnly) throw ApiError.forbidden(`${d.label} is read-only`);
  const clean = sanitizeWrite(body, d.redact);
  const created = await d.model.create(clean);
  await recordAudit({
    action: AuditAction.COLLECTION_CREATED,
    actorId,
    metadata: { collection: name, docId: created._id },
    req,
  });
  return getDocument(name, created._id);
}

export async function updateDocument(
  name: string,
  id: string,
  body: Record<string, unknown>,
  actorId: string,
  req: Request,
) {
  const d = def(name);
  if (d.readOnly) throw ApiError.forbidden(`${d.label} is read-only`);
  const clean = sanitizeWrite(body, d.redact);
  const updated = await d.model.findByIdAndUpdate(id, { $set: clean }, { new: true });
  if (!updated) throw ApiError.notFound('Document not found');
  await recordAudit({
    action: AuditAction.COLLECTION_UPDATED,
    actorId,
    metadata: { collection: name, docId: id, fields: Object.keys(clean) },
    req,
  });
  return getDocument(name, id);
}

export async function deleteDocument(
  name: string,
  id: string,
  actorId: string,
  req: Request,
) {
  const d = def(name);
  if (d.readOnly) throw ApiError.forbidden(`${d.label} is read-only`);
  const doc = await d.model.findById(id);
  if (!doc) throw ApiError.notFound('Document not found');
  await recordAudit({
    action: AuditAction.COLLECTION_DELETED,
    actorId,
    metadata: { collection: name, docId: id },
    req,
  });
  await d.model.deleteOne({ _id: id });
}
