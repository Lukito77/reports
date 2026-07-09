import { Schema, model, models, type Model, type HydratedDocument } from 'mongoose';
import { applyBaseConfig } from './_shared';

/**
 * Singleton site configuration: theme tokens, branding, and layout flags that
 * the public site reads (via `/settings/public`) and the Appearance editor
 * writes. Exactly one document exists, identified by the fixed `key`.
 */
export const SITE_SETTING_KEY = 'global';

export interface ITheme {
  // Brand palette stops (hex). The frontend maps these to CSS variables so the
  // existing Tailwind `bg-brand-*` classes follow the configured theme.
  brand50: string;
  brand100: string;
  brand500: string;
  brand600: string;
  brand700: string;
  // Surface tokens (hex).
  background: string;
  foreground: string;
  accent: string;
  // Typography.
  fontFamily: string;
  fontSizeBase: number; // px
  radius: number; // px
}

export interface IBranding {
  siteName: string;
  logoEmoji: string;
  tagline: string;
}

export interface ILayout {
  containerWidth: 'narrow' | 'normal' | 'wide' | 'full';
  showFooter: boolean;
  showLanguageSwitcher: boolean;
  showReportButton: boolean;
}

export interface ISiteSetting {
  _id: string;
  key: string;
  theme: ITheme;
  branding: IBranding;
  layout: ILayout;
  updatedAt: Date;
  createdAt: Date;
}

export type SiteSettingDocument = HydratedDocument<ISiteSetting>;

export const DEFAULT_THEME: ITheme = {
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
};

export const DEFAULT_BRANDING: IBranding = {
  siteName: 'Reports',
  logoEmoji: '🏛️',
  tagline: '',
};

export const DEFAULT_LAYOUT: ILayout = {
  containerWidth: 'normal',
  showFooter: true,
  showLanguageSwitcher: true,
  showReportButton: true,
};

const ThemeSchema = new Schema<ITheme>(
  {
    brand50: { type: String, default: DEFAULT_THEME.brand50 },
    brand100: { type: String, default: DEFAULT_THEME.brand100 },
    brand500: { type: String, default: DEFAULT_THEME.brand500 },
    brand600: { type: String, default: DEFAULT_THEME.brand600 },
    brand700: { type: String, default: DEFAULT_THEME.brand700 },
    background: { type: String, default: DEFAULT_THEME.background },
    foreground: { type: String, default: DEFAULT_THEME.foreground },
    accent: { type: String, default: DEFAULT_THEME.accent },
    fontFamily: { type: String, default: DEFAULT_THEME.fontFamily },
    fontSizeBase: { type: Number, default: DEFAULT_THEME.fontSizeBase },
    radius: { type: Number, default: DEFAULT_THEME.radius },
  },
  { _id: false },
);

const BrandingSchema = new Schema<IBranding>(
  {
    siteName: { type: String, default: DEFAULT_BRANDING.siteName },
    logoEmoji: { type: String, default: DEFAULT_BRANDING.logoEmoji },
    tagline: { type: String, default: DEFAULT_BRANDING.tagline },
  },
  { _id: false },
);

const LayoutSchema = new Schema<ILayout>(
  {
    containerWidth: { type: String, default: DEFAULT_LAYOUT.containerWidth },
    showFooter: { type: Boolean, default: DEFAULT_LAYOUT.showFooter },
    showLanguageSwitcher: { type: Boolean, default: DEFAULT_LAYOUT.showLanguageSwitcher },
    showReportButton: { type: Boolean, default: DEFAULT_LAYOUT.showReportButton },
  },
  { _id: false },
);

const SiteSettingSchema = new Schema<ISiteSetting>({
  _id: { type: String, default: SITE_SETTING_KEY },
  key: { type: String, default: SITE_SETTING_KEY, unique: true },
  theme: { type: ThemeSchema, default: () => ({}) },
  branding: { type: BrandingSchema, default: () => ({}) },
  layout: { type: LayoutSchema, default: () => ({}) },
});
applyBaseConfig(SiteSettingSchema, true);

export const SiteSetting: Model<ISiteSetting> =
  (models.SiteSetting as Model<ISiteSetting>) ||
  model<ISiteSetting>('SiteSetting', SiteSettingSchema);
