import { BrandPalette, createBrandPalette, isHexColor } from 'src/theme/palette';
import { Restaurant } from 'src/types/restaurant';

export type BrandingSource = 'restaurant' | 'default';

export interface BrandingPaletteSource {
  primary: BrandingSource;
  secondary: BrandingSource;
}

export interface Branding {
  palette: BrandPalette;
  paletteSource: BrandingPaletteSource;
}

function firstColor(...candidates: (string | null | undefined)[]): string | null {
  return candidates.find(isHexColor) ?? null;
}

function resolveColorSource(restaurantColor?: string | null): BrandingSource {
  if (isHexColor(restaurantColor)) {
    return 'restaurant';
  }

  return 'default';
}

export function createBranding(restaurant: Restaurant | null): Branding {
  return {
    palette: createBrandPalette(firstColor(restaurant?.primary_color), firstColor(restaurant?.secondary_color)),
    paletteSource: {
      primary: resolveColorSource(restaurant?.primary_color),
      secondary: resolveColorSource(restaurant?.secondary_color),
    },
  };
}

export function resolveTenantPrimaryColor(branding: Branding): string | null {
  if (branding.paletteSource.primary === 'default') {
    return null;
  }

  return branding.palette.primary.main;
}

export const defaultBranding: Branding = createBranding(null);
