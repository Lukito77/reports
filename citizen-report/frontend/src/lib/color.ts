/** Small hex-color helpers for the Appearance editor's palette generator. */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('')}`;
}

/** Blend `hex` toward `target` by `amt` (0..1). */
export function mix(hex: string, target: string, amt: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(a.r + (b.r - a.r) * amt, a.g + (b.g - a.g) * amt, a.b + (b.b - a.b) * amt);
}

const WHITE = '#ffffff';
const BLACK = '#000000';

/** Derive the 5 brand stops from a single primary color (used as brand-600). */
export function deriveBrandScale(base: string) {
  return {
    brand50: mix(base, WHITE, 0.92),
    brand100: mix(base, WHITE, 0.82),
    brand500: mix(base, WHITE, 0.12),
    brand600: base,
    brand700: mix(base, BLACK, 0.18),
  };
}

export function isHexColor(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}
