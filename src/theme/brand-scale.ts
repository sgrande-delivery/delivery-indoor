import { ResolvedColorScheme } from './color-scheme';
import { fromOklch, toOklch } from './oklch';
import { contrastRatio, toColorChannel, toHexColor } from './palette';
import {
  brandTones,
  BrandToneTokens,
  ChromeTokens,
  ON_DARK_PRIMARY_SUPPORT_INK,
  ON_DARK_PRIMARY_WASH,
  ON_LIGHT_PRIMARY_SUPPORT_INK,
  ON_LIGHT_PRIMARY_WASH,
  staticChrome,
  surfaces,
  SurfaceTokens,
  TranslucentInk,
} from './surfaces';
import { compositeOver } from './translucent-tone';

export interface BrandScale {
  surface: SurfaceTokens;
  chrome: ChromeTokens;
  brand: BrandToneTokens;
}

type BrandToneStepName = Exclude<keyof BrandToneTokens, 'onPrimarySupport' | 'onPrimaryWash'>;

type ChromeStepName = Exclude<keyof ChromeTokens, 'baseChannel'>;

type ScaleStep = readonly [number, number] | string;

interface SchemeSteps {
  surface: Record<keyof SurfaceTokens, ScaleStep>;
  chrome: Record<ChromeStepName, ScaleStep>;
  brand: Record<BrandToneStepName, ScaleStep>;
}

const MINIMUM_CHROMA = 0.04;
const MAXIMUM_CHROMA = 0.33;
const LIGHT_PRIMARY_LIGHTNESS = 0.74;
const LIGHT_CARD = '#FFFFFF';
const MINIMUM_TEXT_CONTRAST = 4.5;

function supportInkContrast(ink: TranslucentInk, background: string): number {
  return contrastRatio(compositeOver(toHexColor(ink.channels), background, ink.opacity), background);
}

export function resolvePrimarySupportInk(background: string): string {
  const onLight = supportInkContrast(ON_LIGHT_PRIMARY_SUPPORT_INK, background);
  const onDark = supportInkContrast(ON_DARK_PRIMARY_SUPPORT_INK, background);

  return onLight >= onDark ? ON_LIGHT_PRIMARY_SUPPORT_INK.value : ON_DARK_PRIMARY_SUPPORT_INK.value;
}

const lightSteps: SchemeSteps = {
  surface: {
    page: [0.968, 0.2],
    card: LIGHT_CARD,
    ink: [0.21, 0.3],
    muted: [0.52, 0.18],
    line: [0.9, 0.24],
    field: [0.945, 0.22],
  },
  chrome: {
    raised: [0.34, 0.6],
    base: [0.2, 0.45],
    ink: [0.97, 0.03],
    muted: [0.78, 0.14],
    dim: [0.61, 0.12],
    accent: [0.76, 0.85],
    idle: [0.62, 0.12],
  },
  brand: {
    soft: [0.93, 0.36],
    onSoft: [0.42, 0.85],
    text: [0.48, 0.95],
    textHover: [0.42, 0.95],
    strong: [0.42, 0.88],
  },
};

const darkSteps: SchemeSteps = {
  surface: {
    page: [0.17, 0.26],
    card: [0.235, 0.22],
    ink: [0.96, 0.03],
    muted: [0.72, 0.07],
    line: [0.33, 0.12],
    field: [0.27, 0.2],
  },
  chrome: {
    raised: [0.26, 0.26],
    base: [0.13, 0.22],
    ink: [0.96, 0.03],
    muted: [0.74, 0.07],
    dim: [0.58, 0.06],
    accent: [0.76, 0.9],
    idle: [0.62, 0.06],
  },
  brand: {
    soft: [0.31, 0.26],
    onSoft: [0.9, 0.12],
    text: [0.72, 0.95],
    textHover: [0.78, 0.95],
    strong: [0.55, 0.9],
  },
};

const schemeSteps: Record<ResolvedColorScheme, SchemeSteps> = {
  light: lightSteps,
  dark: darkSteps,
};

function resolveStep(step: ScaleStep, chroma: number, hue: number): string {
  if (typeof step === 'string') {
    return step;
  }

  const [lightness, chromaMultiplier] = step;

  return fromOklch(lightness, Math.min(chroma * chromaMultiplier, MAXIMUM_CHROMA), hue);
}

function resolveSurfaces(steps: SchemeSteps['surface'], chroma: number, hue: number): SurfaceTokens {
  return {
    page: resolveStep(steps.page, chroma, hue),
    card: resolveStep(steps.card, chroma, hue),
    ink: resolveStep(steps.ink, chroma, hue),
    muted: resolveStep(steps.muted, chroma, hue),
    line: resolveStep(steps.line, chroma, hue),
    field: resolveStep(steps.field, chroma, hue),
  };
}

function resolveChrome(steps: SchemeSteps['chrome'], chroma: number, hue: number): ChromeTokens {
  const base = resolveStep(steps.base, chroma, hue);

  return {
    raised: resolveStep(steps.raised, chroma, hue),
    base,
    baseChannel: toColorChannel(base),
    ink: resolveStep(steps.ink, chroma, hue),
    muted: resolveStep(steps.muted, chroma, hue),
    dim: resolveStep(steps.dim, chroma, hue),
    accent: resolveStep(steps.accent, chroma, hue),
    idle: resolveStep(steps.idle, chroma, hue),
  };
}

function resolveBrandTones(
  steps: SchemeSteps['brand'],
  chroma: number,
  hue: number,
  primary: string,
  isLightPrimary: boolean
): BrandToneTokens {
  return {
    soft: resolveStep(steps.soft, chroma, hue),
    onSoft: resolveStep(steps.onSoft, chroma, hue),
    text: resolveStep(steps.text, chroma, hue),
    textHover: resolveStep(steps.textHover, chroma, hue),
    strong: resolveStep(steps.strong, chroma, hue),
    onPrimarySupport: resolvePrimarySupportInk(primary),
    onPrimaryWash: isLightPrimary ? ON_LIGHT_PRIMARY_WASH : ON_DARK_PRIMARY_WASH,
  };
}

export function createBrandScale(primary: string, scheme: ResolvedColorScheme): BrandScale {
  const { l, c, h } = toOklch(primary);
  const chroma = Math.max(c, MINIMUM_CHROMA);
  const steps = schemeSteps[scheme];

  return {
    surface: resolveSurfaces(steps.surface, chroma, h),
    chrome: resolveChrome(steps.chrome, chroma, h),
    brand: resolveBrandTones(steps.brand, chroma, h, primary, l > LIGHT_PRIMARY_LIGHTNESS),
  };
}

export function resolveScaleSurfaces(primary: string | null, scheme: ResolvedColorScheme): SurfaceTokens {
  if (!primary) {
    return surfaces[scheme];
  }

  return createBrandScale(primary, scheme).surface;
}

export interface SplashInk {
  name: string;
  signature: string;
}

export function resolveSplashInk(primary: string | null, background: string): SplashInk {
  const light = resolveScaleSurfaces(primary, 'light');
  const dark = resolveScaleSurfaces(primary, 'dark');
  const pair = contrastRatio(light.ink, background) >= contrastRatio(dark.ink, background) ? light : dark;
  const signature = contrastRatio(pair.muted, background) >= MINIMUM_TEXT_CONTRAST ? pair.muted : pair.ink;

  return { name: pair.ink, signature };
}

export function resolveScaleChrome(primary: string | null, scheme: ResolvedColorScheme): ChromeTokens {
  if (!primary) {
    return staticChrome;
  }

  return createBrandScale(primary, scheme).chrome;
}

export function resolveScaleBrandTones(primary: string | null, scheme: ResolvedColorScheme): BrandToneTokens {
  if (!primary) {
    return brandTones[scheme];
  }

  return createBrandScale(primary, scheme).brand;
}
