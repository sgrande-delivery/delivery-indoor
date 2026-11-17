import { CSSProperties } from 'react';
import { createTheme as createMuiTheme, PaletteOptions, Shadows, Theme } from '@mui/material/styles';
import { COLOR_SCHEME_ATTRIBUTE } from './color-scheme';
import { components } from './components';
import { defaultBrandPalette } from './palette';
import { darkStatusOnPage, lightStatusOnPage, StatusOnPageTokens } from './status-tones';
import {
  BrandToneTokens,
  ChromeTokens,
  darkBrandTones,
  darkSurfaces,
  lightBrandTones,
  lightSurfaces,
  staticChrome,
  statusTokens,
  SurfaceTokens,
} from './surfaces';
import { elevations, fontFamilies, fontWeights, motion, radii, typographyTokens } from './tokens';
import { darkToneOnCard, lightToneOnCard, ToneOnCardTokens } from './tone-on-card';

declare module '@mui/material/styles' {
  interface CssThemeVariables {
    enabled: true;
  }

  interface Palette {
    surface: SurfaceTokens;
    chrome: ChromeTokens;
    brand: BrandToneTokens;
    statusOnPage: StatusOnPageTokens;
    toneOnCard: ToneOnCardTokens;
  }

  interface PaletteOptions {
    surface?: SurfaceTokens;
    chrome?: ChromeTokens;
    brand?: BrandToneTokens;
    statusOnPage?: StatusOnPageTokens;
    toneOnCard?: ToneOnCardTokens;
  }

  interface TypographyVariants {
    label: CSSProperties;
    price: CSSProperties;
  }

  interface TypographyVariantsOptions {
    label?: CSSProperties;
    price?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    label: true;
    price: true;
  }
}

const SHADOW_COUNT = 25;
const SMALL_ELEVATION_LIMIT = 4;
const MEDIUM_ELEVATION_LIMIT = 12;

function createShadows(): Shadows {
  const shadows = Array.from({ length: SHADOW_COUNT }, (unused, index) => {
    if (index === 0) {
      return 'none';
    }

    if (index <= SMALL_ELEVATION_LIMIT) {
      return elevations.sm;
    }

    if (index <= MEDIUM_ELEVATION_LIMIT) {
      return elevations.md;
    }

    return elevations.lg;
  });

  return shadows as Shadows;
}

interface SchemePaletteOptions {
  surface: SurfaceTokens;
  chrome: ChromeTokens;
  brand: BrandToneTokens;
  statusOnPage: StatusOnPageTokens;
  toneOnCard: ToneOnCardTokens;
  mode: 'light' | 'dark';
}

function createSchemePalette({
  surface,
  chrome,
  brand,
  statusOnPage,
  toneOnCard,
  mode,
}: SchemePaletteOptions): PaletteOptions {
  return {
    mode,
    primary: defaultBrandPalette.primary,
    secondary: defaultBrandPalette.secondary,
    success: { main: statusTokens.success },
    error: { main: statusTokens.danger },
    warning: { main: statusTokens.warn },
    background: { default: surface.page, paper: surface.card },
    text: { primary: surface.ink, secondary: surface.muted },
    divider: surface.line,
    surface,
    chrome,
    brand,
    statusOnPage,
    toneOnCard,
  };
}

export function createAppTheme(): Theme {
  return createMuiTheme({
    cssVariables: { colorSchemeSelector: COLOR_SCHEME_ATTRIBUTE },
    colorSchemes: {
      light: {
        palette: createSchemePalette({
          surface: lightSurfaces,
          chrome: staticChrome,
          brand: lightBrandTones,
          statusOnPage: lightStatusOnPage,
          toneOnCard: lightToneOnCard,
          mode: 'light',
        }),
      },
      dark: {
        palette: createSchemePalette({
          surface: darkSurfaces,
          chrome: staticChrome,
          brand: darkBrandTones,
          statusOnPage: darkStatusOnPage,
          toneOnCard: darkToneOnCard,
          mode: 'dark',
        }),
      },
    },
    shape: { borderRadius: radii.md },
    shadows: createShadows(),
    typography: {
      fontFamily: fontFamilies.text,
      fontSize: 14,
      fontWeightLight: fontWeights.light,
      fontWeightRegular: fontWeights.regular,
      fontWeightMedium: fontWeights.medium,
      fontWeightBold: fontWeights.bold,
      ...typographyTokens,
    },
    transitions: {
      duration: {
        shorter: motion.duration.fast,
        standard: motion.duration.standard,
        complex: motion.duration.slow,
      },
      easing: {
        easeInOut: motion.easing.standard,
        easeOut: motion.easing.decelerate,
        easeIn: motion.easing.accelerate,
      },
    },
    components,
  });
}

export const appTheme = createAppTheme();
