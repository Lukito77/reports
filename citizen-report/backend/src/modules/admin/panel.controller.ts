/** Controllers for the admin control panel (settings, content, users/permissions, collections, analytics). */
import { Request, Response } from 'express';
import { ApiError } from '../../middleware/error';
import * as settings from './settings.service';
import * as content from './content.service';
import * as perms from './permissions.service';
import * as collections from './collections.service';
import * as analytics from './analytics.service';

// ── Settings ──────────────────────────────────────────────────────────────
export async function getSettings(_req: Request, res: Response) {
  res.json({ settings: await settings.getSettings() });
}
export async function updateSettings(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  res.json({ settings: await settings.updateSettings(req.body, req.user.id, req) });
}

// ── Content ───────────────────────────────────────────────────────────────
export async function listContent(_req: Request, res: Response) {
  res.json(await content.listContent());
}
export async function createContent(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  res.status(201).json({ content: await content.createContent(req.body, req.user.id, req) });
}
export async function updateContent(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  res.json({ content: await content.updateContent(req.params.id, req.body, req.user.id, req) });
}
export async function deleteContent(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  await content.deleteContent(req.params.id, req.user.id, req);
  res.status(204).send();
}

// ── Users & permissions ─────────────────────────────────────────────────────
export async function listUsers(req: Request, res: Response) {
  res.json(await perms.listUsers(req.query as never));
}
export async function updatePermissions(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  res.json({
    user: await perms.updatePermissions(
      req.params.userId,
      req.body.permissions,
      req.user.id,
      req,
    ),
  });
}
export async function permissionCatalog(_req: Request, res: Response) {
  res.json(perms.permissionCatalog());
}

// ── Generic collections ─────────────────────────────────────────────────────
export async function listCollections(_req: Request, res: Response) {
  res.json(collections.listCollections());
}
export async function listDocuments(req: Request, res: Response) {
  res.json(await collections.listDocuments(req.params.name, req.query as never));
}
export async function getDocument(req: Request, res: Response) {
  res.json(await collections.getDocument(req.params.name, req.params.id));
}
export async function createDocument(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  res
    .status(201)
    .json(await collections.createDocument(req.params.name, req.body, req.user.id, req));
}
export async function updateDocument(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await collections.updateDocument(req.params.name, req.params.id, req.body, req.user.id, req));
}
export async function deleteDocument(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  await collections.deleteDocument(req.params.name, req.params.id, req.user.id, req);
  res.status(204).send();
}

// ── Analytics ───────────────────────────────────────────────────────────────
export async function getAnalytics(req: Request, res: Response) {
  const days = (req.query as { days?: number }).days ?? 30;
  res.json(await analytics.getAnalytics(Number(days)));
}
