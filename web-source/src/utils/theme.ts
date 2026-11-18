export interface Theme {
  background: string;
  accent: string;
}

type Rgb = [number, number, number];

const DEFAULT_THEME: Theme = { background: '#020610', accent: '#4c74f0' };

// How far each ink shade is mixed towards white, starting from the background color.
const INK_SHADES: Record<string, number> = {
  950: 0, 925: 0.02, 900: 0.04, 850: 0.06, 800: 0.08, 750: 0.11, 700: 0.15,
  600: 0.21, 500: 0.3, 400: 0.44, 300: 0.6, 200: 0.76, 100: 0.89, 50: 0.95,
};

// Positive values mix the accent towards white, negative towards black.
const ACCENT_SHADES: Record<string, number> = {
  50: 0.9, 100: 0.8, 200: 0.6, 300: 0.38, 400: 0.18, 500: 0, 600: -0.12, 700: -0.3,
};

function parseHex(value: unknown): Rgb | null {
  if (typeof value !== 'string') return null;

  let hex = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/./g, c => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;

  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(color: Rgb, amount: number): string {
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  return color.map(c => Math.round(c + (target - c) * t)).join(' ');
}

function setShades(name: string, color: Rgb, shades: Record<string, number>) {
  const style = document.documentElement.style;
  for (const [shade, amount] of Object.entries(shades)) {
    style.setProperty(`--${name}-${shade}`, mix(color, amount));
  }
}

/** Sets the ink and accent palettes from config. Invalid colors fall back to the defaults. */
export function applyTheme(theme?: Partial<Theme>) {
  const background = parseHex(theme?.background) ?? parseHex(DEFAULT_THEME.background);
  const accent = parseHex(theme?.accent) ?? parseHex(DEFAULT_THEME.accent);
  if (background) setShades('ink', background, INK_SHADES);
  if (accent) setShades('accent', accent, ACCENT_SHADES);
}
