import { resolveScaleBrandTones, resolveScaleChrome, resolveScaleSurfaces } from './brand-scale';
import { COLOR_SCHEME_ATTRIBUTE, ResolvedColorScheme } from './color-scheme';
import { BrandColor, BrandPalette, toColorChannel } from './palette';
import { resolveScaleStatusOnPage, StatusOnPageTokens } from './status-tones';
import { BrandToneTokens, ChromeTokens, OrderStatusTokens, SurfaceTokens } from './surfaces';
import { OrderStatusBadgeTone, OrderStatusDetailTone, resolveScaleToneOnCard, ToneOnCardTokens } from './tone-on-card';
import { TranslucentSkin } from './translucent-tone';

export const BRAND_VARIABLES_SELECTOR = ':root:root';

export const BRAND_DARK_VARIABLES_SELECTOR = `:root:root[${COLOR_SCHEME_ATTRIBUTE}="dark"]`;

type BrandColorName = 'primary' | 'secondary';

export type CssVariables = Record<string, string>;

function createColorVariables(name: BrandColorName, color: BrandColor): CssVariables {
  return {
    [`--mui-palette-${name}-main`]: color.main,
    [`--mui-palette-${name}-light`]: color.light,
    [`--mui-palette-${name}-dark`]: color.dark,
    [`--mui-palette-${name}-contrastText`]: color.contrastText,
    [`--mui-palette-${name}-mainChannel`]: toColorChannel(color.main),
    [`--mui-palette-${name}-lightChannel`]: toColorChannel(color.light),
    [`--mui-palette-${name}-darkChannel`]: toColorChannel(color.dark),
    [`--mui-palette-${name}-contrastTextChannel`]: toColorChannel(color.contrastText),
  };
}

function createSurfaceVariables(surface: SurfaceTokens): CssVariables {
  return {
    '--mui-palette-surface-page': surface.page,
    '--mui-palette-surface-card': surface.card,
    '--mui-palette-surface-ink': surface.ink,
    '--mui-palette-surface-muted': surface.muted,
    '--mui-palette-surface-line': surface.line,
    '--mui-palette-surface-field': surface.field,
    '--mui-palette-background-default': surface.page,
    '--mui-palette-background-defaultChannel': toColorChannel(surface.page),
    '--mui-palette-background-paper': surface.card,
    '--mui-palette-background-paperChannel': toColorChannel(surface.card),
    '--mui-palette-text-primary': surface.ink,
    '--mui-palette-text-primaryChannel': toColorChannel(surface.ink),
    '--mui-palette-text-secondary': surface.muted,
    '--mui-palette-text-secondaryChannel': toColorChannel(surface.muted),
    '--mui-palette-divider': surface.line,
    '--mui-palette-dividerChannel': toColorChannel(surface.line),
  };
}

function createChromeVariables(chrome: ChromeTokens): CssVariables {
  return {
    '--mui-palette-chrome-raised': chrome.raised,
    '--mui-palette-chrome-base': chrome.base,
    '--mui-palette-chrome-baseChannel': chrome.baseChannel,
    '--mui-palette-chrome-ink': chrome.ink,
    '--mui-palette-chrome-muted': chrome.muted,
    '--mui-palette-chrome-dim': chrome.dim,
    '--mui-palette-chrome-accent': chrome.accent,
    '--mui-palette-chrome-idle': chrome.idle,
  };
}

function createBrandToneVariables(brand: BrandToneTokens): CssVariables {
  return {
    '--mui-palette-brand-soft': brand.soft,
    '--mui-palette-brand-onSoft': brand.onSoft,
    '--mui-palette-brand-text': brand.text,
    '--mui-palette-brand-textHover': brand.textHover,
    '--mui-palette-brand-strong': brand.strong,
    '--mui-palette-brand-onPrimarySupport': brand.onPrimarySupport,
    '--mui-palette-brand-onPrimaryWash': brand.onPrimaryWash,
  };
}

function createStatusOnPageVariables(statusOnPage: StatusOnPageTokens): CssVariables {
  return {
    '--mui-palette-statusOnPage-dangerText': statusOnPage.dangerText,
    '--mui-palette-statusOnPage-dangerGlyph': statusOnPage.dangerGlyph,
    '--mui-palette-statusOnPage-warnGlyph': statusOnPage.warnGlyph,
  };
}

function createBadgeToneVariables(status: keyof OrderStatusTokens, tone: OrderStatusBadgeTone): CssVariables {
  return {
    [`--mui-palette-toneOnCard-badge-${status}-background`]: tone.background,
    [`--mui-palette-toneOnCard-badge-${status}-text`]: tone.text,
    [`--mui-palette-toneOnCard-badge-${status}-dot`]: tone.dot,
  };
}

function createDetailToneVariables(status: keyof OrderStatusTokens, tone: OrderStatusDetailTone): CssVariables {
  return {
    [`--mui-palette-toneOnCard-detail-${status}-text`]: tone.text,
    [`--mui-palette-toneOnCard-detail-${status}-dot`]: tone.dot,
    [`--mui-palette-toneOnCard-detail-${status}-dotChannel`]: tone.dotChannel,
    [`--mui-palette-toneOnCard-detail-${status}-markerBackground`]: tone.markerBackground,
    [`--mui-palette-toneOnCard-detail-${status}-markerColor`]: tone.markerColor,
  };
}

type TranslucentSkinKey = {
  [Key in keyof ToneOnCardTokens]: ToneOnCardTokens[Key] extends TranslucentSkin ? Key : never;
}[keyof ToneOnCardTokens];

function createTranslucentSkinVariables(name: TranslucentSkinKey, skin: TranslucentSkin): CssVariables {
  return {
    [`--mui-palette-toneOnCard-${name}-backgroundColor`]: skin.backgroundColor,
    [`--mui-palette-toneOnCard-${name}-color`]: skin.color,
  };
}

function createToneOnCardVariables(toneOnCard: ToneOnCardTokens): CssVariables {
  return {
    ...createBadgeToneVariables('pendingPayment', toneOnCard.badge.pendingPayment),
    ...createBadgeToneVariables('open', toneOnCard.badge.open),
    ...createBadgeToneVariables('approved', toneOnCard.badge.approved),
    ...createBadgeToneVariables('dispatched', toneOnCard.badge.dispatched),
    ...createBadgeToneVariables('completed', toneOnCard.badge.completed),
    ...createBadgeToneVariables('cancelled', toneOnCard.badge.cancelled),
    ...createDetailToneVariables('pendingPayment', toneOnCard.detail.pendingPayment),
    ...createDetailToneVariables('open', toneOnCard.detail.open),
    ...createDetailToneVariables('approved', toneOnCard.detail.approved),
    ...createDetailToneVariables('dispatched', toneOnCard.detail.dispatched),
    ...createDetailToneVariables('completed', toneOnCard.detail.completed),
    ...createDetailToneVariables('cancelled', toneOnCard.detail.cancelled),
    '--mui-palette-toneOnCard-success': toneOnCard.success,
    '--mui-palette-toneOnCard-danger': toneOnCard.danger,
    ...createTranslucentSkinVariables('paidTile', toneOnCard.paidTile),
    ...createTranslucentSkinVariables('brandTile', toneOnCard.brandTile),
    ...createTranslucentSkinVariables('saving', toneOnCard.saving),
    ...createTranslucentSkinVariables('expiredPill', toneOnCard.expiredPill),
    '--mui-palette-toneOnCard-offerGlyph': toneOnCard.offerGlyph,
    '--mui-palette-toneOnCard-brandGlyph': toneOnCard.brandGlyph,
  };
}

function createSchemeVariables(
  palette: BrandPalette,
  tenantPrimaryColor: string | null,
  scheme: ResolvedColorScheme
): CssVariables {
  return {
    ...createSurfaceVariables(resolveScaleSurfaces(tenantPrimaryColor, scheme)),
    ...createChromeVariables(resolveScaleChrome(tenantPrimaryColor, scheme)),
    ...createBrandToneVariables(resolveScaleBrandTones(tenantPrimaryColor, scheme)),
    ...createStatusOnPageVariables(resolveScaleStatusOnPage(tenantPrimaryColor, scheme)),
    ...createToneOnCardVariables(resolveScaleToneOnCard(tenantPrimaryColor, palette.primary.main, scheme)),
  };
}

export interface SplashTokens {
  background: string;
  ink: string;
  signature: string;
  card: string;
}

function createSplashVariables(tokens: SplashTokens): CssVariables {
  return {
    '--splash-background': tokens.background,
    '--splash-ink': tokens.ink,
    '--splash-signature': tokens.signature,
    '--splash-card': tokens.card,
  };
}

function createDarkSplashTokens(tenantPrimaryColor: string | null): SplashTokens {
  const surface = resolveScaleSurfaces(tenantPrimaryColor, 'dark');

  return { background: surface.page, ink: surface.ink, signature: surface.muted, card: surface.card };
}

export function createBrandVariables(palette: BrandPalette): CssVariables {
  return {
    ...createColorVariables('primary', palette.primary),
    ...createColorVariables('secondary', palette.secondary),
  };
}

export function createBrandGlobalStyles(
  palette: BrandPalette,
  tenantPrimaryColor: string | null,
  splash: SplashTokens
): Record<string, CssVariables> {
  return {
    [BRAND_VARIABLES_SELECTOR]: {
      ...createBrandVariables(palette),
      ...createSchemeVariables(palette, tenantPrimaryColor, 'light'),
      ...createSplashVariables(splash),
    },
    [BRAND_DARK_VARIABLES_SELECTOR]: {
      ...createSchemeVariables(palette, tenantPrimaryColor, 'dark'),
      ...createSplashVariables(createDarkSplashTokens(tenantPrimaryColor)),
    },
  };
}
