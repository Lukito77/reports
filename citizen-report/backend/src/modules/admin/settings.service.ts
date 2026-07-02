/**
 * Site settings (theme / branding / layout). One singleton document drives the
 * public site's appearance. Reads auto-create the default doc so the editor and
 * the public endpoint always have something to work with.
 */
import { SiteSetting, SITE_SETTING_KEY, AuditAction } from '../../models';
import type { ISiteSetting } from '../../models';
import { recordAudit } from '../../lib/audit';
import type { Request } from 'express';

export async function getSettings(): Promise<ISiteSetting> {
  const existing = await SiteSetting.findById(SITE_SETTING_KEY);
  if (existing) return existing.toObject() as unknown as ISiteSetting;
  const created = await SiteSetting.create({ _id: SITE_SETTING_KEY, key: SITE_SETTING_KEY });
  return created.toObject() as unknown as ISiteSetting;
}

type SettingsPatch = {
  theme?: Record<string, unknown>;
  branding?: Record<string, unknown>;
  layout?: Record<string, unknown>;
};

export async function updateSettings(patch: SettingsPatch, actorId: string, req: Request) {
  // Build a dotted $set so we merge into nested subdocuments instead of
  // replacing whole objects (a partial theme patch must not wipe other tokens).
  const $set: Record<string, unknown> = {};
  for (const section of ['theme', 'branding', 'layout'] as const) {
    const obj = patch[section];
    if (obj) for (const [k, v] of Object.entries(obj)) $set[`${section}.${k}`] = v;
  }

  const updated = await SiteSetting.findByIdAndUpdate(
    SITE_SETTING_KEY,
    { $set, $setOnInsert: { key: SITE_SETTING_KEY } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await recordAudit({
    action: AuditAction.SETTINGS_UPDATED,
    actorId,
    metadata: { fields: Object.keys($set) },
    req,
  });

  return (updated as NonNullable<typeof updated>).toObject() as unknown as ISiteSetting;
}
