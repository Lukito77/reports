'use client';

/**
 * Site settings (theme / branding / layout). Fetches the public configuration
 * once and injects it as CSS variables on <html> so the whole app — including
 * the existing Tailwind `bg-brand-*` classes — follows the configured theme.
 * The Appearance editor uses `previewTheme` for instant, unsaved live preview.
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { API_URL } from './api';
import type { SiteSettings, Theme } from './types';

export const DEFAULT_SETTINGS: SiteSettings = {
  theme: {
    brand50: '#eef6ff',
    brand100: '#d9ebff',
    brand500: '#2563eb',
    brand600: '#1d4ed8',
    brand700: '#1e40af',
    background: '#f8fafc',
    foreground: '#0f172a',
    accent: '#2563eb',
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans Georgian', sans-serif",
    fontSizeBase: 16,
    radius: 12,
  },
  branding: { siteName: 'Citizen Report', logoEmoji: '🏛️', tagline: '' },
  layout: {
    containerWidth: 'normal',
    showFooter: true,
    showLanguageSwitcher: true,
    showReportButton: true,
  },
};

/** "#1d4ed8" -> "29 78 216" (space-separated RGB channels for Tailwind alpha). */
function hexToRgbTriplet(hex: string): string | null {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const COLOR_VARS: Record<keyof Pick<Theme, 'brand50' | 'brand100' | 'brand500' | 'brand600' | 'brand700' | 'background' | 'foreground' | 'accent'>, string> = {
  brand50: '--brand-50',
  brand100: '--brand-100',
  brand500: '--brand-500',
  brand600: '--brand-600',
  brand700: '--brand-700',
  background: '--app-bg',
  foreground: '--app-fg',
  accent: '--brand-accent',
};

export function applyThemeToDom(theme: Partial<Theme>) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [key, varName] of Object.entries(COLOR_VARS) as [keyof typeof COLOR_VARS, string][]) {
    const value = theme[key];
    if (typeof value === 'string') {
      const triplet = hexToRgbTriplet(value);
      if (triplet) root.style.setProperty(varName, triplet);
    }
  }
  if (theme.fontFamily) root.style.setProperty('--app-font-family', theme.fontFamily);
  if (theme.fontSizeBase) root.style.setProperty('--app-font-size', `${theme.fontSizeBase}px`);
  if (theme.radius != null) root.style.setProperty('--app-radius', `${theme.radius}px`);
}

interface SettingsContextValue {
  settings: SiteSettings;
  loading: boolean;
  /** Apply a theme patch to the DOM immediately (live preview, not persisted). */
  previewTheme: (patch: Partial<Theme>) => void;
  /** Re-fetch the saved settings from the server and re-apply. */
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/settings/public`, { credentials: 'omit' });
      if (!res.ok) return;
      const data = (await res.json()) as Partial<SiteSettings>;
      const merged: SiteSettings = {
        theme: { ...DEFAULT_SETTINGS.theme, ...(data.theme ?? {}) },
        branding: { ...DEFAULT_SETTINGS.branding, ...(data.branding ?? {}) },
        layout: { ...DEFAULT_SETTINGS.layout, ...(data.layout ?? {}) },
      };
      setSettings(merged);
      applyThemeToDom(merged.theme);
    } catch {
      /* keep defaults */
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const previewTheme = useCallback((patch: Partial<Theme>) => {
    setSettings((s) => {
      const next = { ...s, theme: { ...s.theme, ...patch } };
      applyThemeToDom(next.theme);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, previewTheme, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
