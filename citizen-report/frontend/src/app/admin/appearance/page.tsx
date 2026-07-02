'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSettings, DEFAULT_SETTINGS } from '@/lib/settings';
import { deriveBrandScale, isHexColor } from '@/lib/color';
import type { SiteSettings, Theme, Branding, LayoutSettings } from '@/lib/types';

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'System sans (default)', value: DEFAULT_SETTINGS.theme.fontFamily },
  { label: 'Segoe UI', value: "'Segoe UI', system-ui, 'Noto Sans Georgian', sans-serif" },
  { label: 'Helvetica / Arial', value: "'Helvetica Neue', Helvetica, Arial, 'Noto Sans Georgian', sans-serif" },
  { label: 'Verdana', value: "Verdana, Geneva, 'Noto Sans Georgian', sans-serif" },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', system-ui, 'Noto Sans Georgian', sans-serif" },
  { label: 'Georgia (serif)', value: "Georgia, 'Times New Roman', 'Noto Serif Georgian', serif" },
  { label: 'Times New Roman (serif)', value: "'Times New Roman', Times, 'Noto Serif Georgian', serif" },
  { label: 'Monospace', value: "'Courier New', ui-monospace, monospace" },
];

const COLOR_FIELDS: { key: keyof Theme; ka: string; en: string }[] = [
  { key: 'brand600', ka: 'მთავარი ფერი', en: 'Primary' },
  { key: 'brand700', ka: 'მთავარი (მუქი)', en: 'Primary dark' },
  { key: 'brand500', ka: 'მთავარი (ღია)', en: 'Primary light' },
  { key: 'brand100', ka: 'ღია ფონი', en: 'Light tint' },
  { key: 'brand50', ka: 'ძალიან ღია ფონი', en: 'Lightest tint' },
  { key: 'accent', ka: 'აქცენტი', en: 'Accent' },
  { key: 'background', ka: 'გვერდის ფონი', en: 'Page background' },
  { key: 'foreground', ka: 'ტექსტის ფერი', en: 'Text color' },
];

export default function AppearancePage() {
  const { t, lang } = useI18n();
  const { previewTheme, refresh } = useSettings();
  const tr = (ka: string, en: string) => (lang === 'ka' ? ka : en);

  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ settings: SiteSettings }>('/admin/settings')
      .then((d) => setForm(d.settings))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!form) return <p className="text-center text-slate-500">{t.admin.loading}</p>;

  const setTheme = (patch: Partial<Theme>) => {
    setForm((f) => (f ? { ...f, theme: { ...f.theme, ...patch } } : f));
    previewTheme(patch); // live preview
    setMsg(null);
  };
  const setBranding = (patch: Partial<Branding>) =>
    setForm((f) => (f ? { ...f, branding: { ...f.branding, ...patch } } : f));
  const setLayout = (patch: Partial<LayoutSettings>) =>
    setForm((f) => (f ? { ...f, layout: { ...f.layout, ...patch } } : f));

  const applyPrimary = (hex: string) => {
    if (!isHexColor(hex)) return;
    setTheme(deriveBrandScale(hex));
  };

  async function save() {
    if (!form) return;
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      await apiFetch('/admin/settings', { method: 'PUT', body: form });
      await refresh();
      setMsg(tr('შენახულია', 'Saved'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function resetPreview() {
    await refresh();
    const d = await apiFetch<{ settings: SiteSettings }>('/admin/settings');
    setForm(d.settings);
    setMsg(tr('გადატვირთულია შენახულ მნიშვნელობებზე', 'Reverted to saved values'));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tr('გარეგნობა', 'Appearance')}</h1>
        <div className="flex items-center gap-2">
          {msg && <span className="text-sm text-green-600">{msg}</span>}
          <button className="btn-secondary" onClick={resetPreview} disabled={saving}>
            {tr('გაუქმება', 'Revert')}
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? tr('ინახება…', 'Saving…') : tr('შენახვა', 'Save')}
          </button>
        </div>
      </div>

      {/* Quick primary picker */}
      <div className="card space-y-3">
        <h2 className="font-semibold">{tr('სწრაფი თემა', 'Quick theme')}</h2>
        <p className="text-sm text-slate-500">
          {tr(
            'აირჩიეთ მთავარი ფერი — დანარჩენი ელფერები ავტომატურად დაგენერირდება.',
            'Pick a primary color — the rest of the palette is generated automatically.',
          )}
        </p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.theme.brand600}
            onChange={(e) => applyPrimary(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-slate-300"
          />
          <div className="flex gap-1">
            {['#1d4ed8', '#0891b2', '#059669', '#7c3aed', '#db2777', '#ea580c', '#dc2626', '#0f172a'].map(
              (c) => (
                <button
                  key={c}
                  onClick={() => applyPrimary(c)}
                  className="h-8 w-8 rounded-full border border-slate-200"
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ),
            )}
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="card space-y-4">
        <h2 className="font-semibold">{tr('ფერები', 'Colors')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {COLOR_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-3">
              <input
                type="color"
                value={String(form.theme[field.key])}
                onChange={(e) => setTheme({ [field.key]: e.target.value } as Partial<Theme>)}
                className="h-9 w-12 cursor-pointer rounded border border-slate-300"
              />
              <div className="flex-1">
                <label className="label mb-0.5">{tr(field.ka, field.en)}</label>
                <input
                  className="input font-mono text-xs"
                  value={String(form.theme[field.key])}
                  onChange={(e) => setTheme({ [field.key]: e.target.value } as Partial<Theme>)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="card space-y-4">
        <h2 className="font-semibold">{tr('ტიპოგრაფია', 'Typography')}</h2>
        <div>
          <label className="label">{tr('შრიფტი', 'Font family')}</label>
          <select
            className="input"
            value={form.theme.fontFamily}
            onChange={(e) => setTheme({ fontFamily: e.target.value })}
          >
            {FONT_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
            {!FONT_OPTIONS.some((o) => o.value === form.theme.fontFamily) && (
              <option value={form.theme.fontFamily}>{tr('მორგებული', 'Custom')}</option>
            )}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">
              {tr('ძირითადი ზომა', 'Base font size')}: {form.theme.fontSizeBase}px
            </label>
            <input
              type="range"
              min={12}
              max={22}
              value={form.theme.fontSizeBase}
              onChange={(e) => setTheme({ fontSizeBase: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="label">
              {tr('მომრგვალება', 'Corner radius')}: {form.theme.radius}px
            </label>
            <input
              type="range"
              min={0}
              max={28}
              value={form.theme.radius}
              onChange={(e) => setTheme({ radius: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
        <p className="rounded-lg bg-brand-50 p-3 text-brand-700" style={{ fontFamily: form.theme.fontFamily }}>
          {tr('ეს არის შრიფტის წინასწარი ხედი.', 'This is a preview of the selected font.')}
        </p>
      </div>

      {/* Branding */}
      <div className="card space-y-4">
        <h2 className="font-semibold">{tr('ბრენდინგი', 'Branding')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label">{tr('საიტის სახელი', 'Site name')}</label>
            <input
              className="input"
              value={form.branding.siteName}
              onChange={(e) => setBranding({ siteName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{tr('ლოგო (ემოჯი)', 'Logo (emoji)')}</label>
            <input
              className="input"
              value={form.branding.logoEmoji}
              onChange={(e) => setBranding({ logoEmoji: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">{tr('სლოგანი', 'Tagline')}</label>
          <input
            className="input"
            value={form.branding.tagline}
            onChange={(e) => setBranding({ tagline: e.target.value })}
          />
        </div>
      </div>

      {/* Layout */}
      <div className="card space-y-4">
        <h2 className="font-semibold">{tr('განლაგება', 'Layout')}</h2>
        <div>
          <label className="label">{tr('კონტეინერის სიგანე', 'Container width')}</label>
          <select
            className="input"
            value={form.layout.containerWidth}
            onChange={(e) =>
              setLayout({ containerWidth: e.target.value as LayoutSettings['containerWidth'] })
            }
          >
            <option value="narrow">{tr('ვიწრო', 'Narrow')}</option>
            <option value="normal">{tr('ჩვეულებრივი', 'Normal')}</option>
            <option value="wide">{tr('ფართო', 'Wide')}</option>
            <option value="full">{tr('სრული', 'Full')}</option>
          </select>
        </div>
        {(
          [
            ['showFooter', tr('ფუტერის ჩვენება', 'Show footer')],
            ['showLanguageSwitcher', tr('ენის გადამრთველი', 'Language switcher')],
            ['showReportButton', tr('„შეტყობინების“ ღილაკი', 'Report button')],
          ] as [keyof LayoutSettings, string][]
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.layout[key])}
              onChange={(e) => setLayout({ [key]: e.target.checked } as Partial<LayoutSettings>)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
