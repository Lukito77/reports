import type { Config } from 'tailwindcss';

/**
 * Colors are driven by CSS variables (set at runtime by SettingsProvider from
 * the saved theme), so changing the theme in the admin Appearance editor
 * recolors every `bg-brand-*` / `text-brand-*` class without a redeploy.
 * The `<alpha-value>` placeholder keeps Tailwind opacity modifiers working.
 */
const brand = (channel: string) => `rgb(var(${channel}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: brand('--brand-50'),
          100: brand('--brand-100'),
          500: brand('--brand-500'),
          600: brand('--brand-600'),
          700: brand('--brand-700'),
          accent: brand('--brand-accent'),
        },
        surface: brand('--app-bg'),
        ink: brand('--app-fg'),
      },
      fontFamily: {
        sans: ['var(--app-font-family)'],
      },
      borderRadius: {
        theme: 'var(--app-radius)',
      },
    },
  },
  plugins: [],
};

export default config;
