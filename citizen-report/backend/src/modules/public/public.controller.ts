/** Public, unauthenticated read endpoints consumed by the live site. */
import { Request, Response } from 'express';
import * as settings from '../admin/settings.service';
import * as content from '../admin/content.service';

/** Theme + branding + layout for the public site (no sensitive data). */
export async function getPublicSettings(_req: Request, res: Response) {
  const s = await settings.getSettings();
  res.json({
    theme: s.theme,
    branding: s.branding,
    layout: s.layout,
  });
}

/** Editable copy as two locale trees ready to merge over static i18n defaults. */
export async function getPublicContent(_req: Request, res: Response) {
  res.json(await content.publicContent());
}
