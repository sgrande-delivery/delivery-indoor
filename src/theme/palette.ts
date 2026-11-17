import { lightSurfaces } from './surfaces';

export interface BrandColor {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}

export interface BrandPalette {
  primary: BrandColor;
  secondary: BrandColor;
}

export const DEFAULT_PRIMARY_COLOR = '#FF5A1F';
export const DEFAULT_SECONDARY_COLOR = '#FFC53D';

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const WHITE = '#FFFFFF';
const BLACK = '#000000';
const MINIMUM_CONTRAST_RATIO = 3;
const TONAL_OFFSET = 0.2;

export type Rgb = [number, number, number];

export function isHexColor(value: string | null | undefined): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value.trim());
}

export function normalizeHexColor(value: string | null | undefined, fallback: string): string {
  if (!isHexColor(value)) {
    return fallback;
  }

  const candidate = value.trim();

  if (candidate.length === 4) {
    const red = candidate.charAt(1);
    const green = candidate.charAt(2);
    const blue = candidate.charAt(3);

    return `#${red}${red}${green}${green}${blue}${blue}`.toUpperCase();
  }

  return candidate.toUpperCase();
}

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function toRgb(color: string): Rgb {
  const value = parseInt(color.slice(1), 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function toHexColor(rgb: Rgb): string {
  const channels = rgb.map(channel => clampChannel(channel).toString(16).padStart(2, '0'));

  return `#${channels.join('')}`.toUpperCase();
}

export function channelLuminance(channel: number): number {
  const normalized = channel / 255;

  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }

  return ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string): number {
  const [red, green, blue] = toRgb(color);

  return 0.2126 * channelLuminance(red) + 0.7152 * channelLuminance(green) + 0.0722 * channelLuminance(blue);
}

export function contrastRatio(colorA: string, colorB: string): number {
  const luminanceA = relativeLuminance(colorA);
  const luminanceB = relativeLuminance(colorB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
}

export function toColorChannel(color: string): string {
  return toRgb(color).join(' ');
}

function mix(color: string, target: string, weight: number): string {
  const source = toRgb(color);
  const destination = toRgb(target);

  return toHexColor([
    source[0] + (destination[0] - source[0]) * weight,
    source[1] + (destination[1] - source[1]) * weight,
    source[2] + (destination[2] - source[2]) * weight,
  ]);
}

export function lighten(color: string, amount: number): string {
  return mix(color, WHITE, amount);
}

export function darken(color: string, amount: number): string {
  return mix(color, BLACK, amount);
}

export function resolveContrastText(color: string): string {
  const contrastWithWhite = contrastRatio(color, WHITE);

  if (contrastWithWhite >= MINIMUM_CONTRAST_RATIO) {
    return WHITE;
  }

  const contrastWithInk = contrastRatio(color, lightSurfaces.ink);

  return contrastWithInk >= contrastWithWhite ? lightSurfaces.ink : WHITE;
}

function createBrandColor(value: string | null | undefined, fallback: string): BrandColor {
  const main = normalizeHexColor(value, fallback);

  return {
    main,
    light: lighten(main, TONAL_OFFSET),
    dark: darken(main, TONAL_OFFSET),
    contrastText: resolveContrastText(main),
  };
}

export function createBrandPalette(primaryColor?: string | null, secondaryColor?: string | null): BrandPalette {
  return {
    primary: createBrandColor(primaryColor, DEFAULT_PRIMARY_COLOR),
    secondary: createBrandColor(secondaryColor, DEFAULT_SECONDARY_COLOR),
  };
}

export const defaultBrandPalette: BrandPalette = createBrandPalette();
