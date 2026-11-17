import { resolveScaleSurfaces } from './brand-scale';
import { ResolvedColorScheme } from './color-scheme';
import { checkoutMetrics } from './component-tokens';
import { darkSurfaces, lightSurfaces, statusTokens } from './surfaces';
import { compositeOver, GRAPHIC_CONTRAST_FLOOR, resolveToneAgainst, TEXT_CONTRAST_FLOOR } from './translucent-tone';

export interface StatusOnPageTokens {
  dangerText: string;
  dangerGlyph: string;
  warnGlyph: string;
}

const DANGER_WASH_OPACITY = checkoutMetrics.cardFailure.backgroundOpacity;
const WARN_WASH_OPACITY = checkoutMetrics.submitFailure.rejectedCircleOpacity;

function resolveWashTone(color: string, page: string, opacity: number, towardWhite: boolean, floor: number): string {
  return resolveToneAgainst(color, compositeOver(color, page, opacity), towardWhite, floor);
}

export function createStatusOnPageTones(page: string, towardWhite: boolean): StatusOnPageTokens {
  return {
    dangerText: resolveWashTone(statusTokens.danger, page, DANGER_WASH_OPACITY, towardWhite, TEXT_CONTRAST_FLOOR),
    dangerGlyph: resolveWashTone(statusTokens.danger, page, DANGER_WASH_OPACITY, towardWhite, GRAPHIC_CONTRAST_FLOOR),
    warnGlyph: resolveWashTone(statusTokens.warn, page, WARN_WASH_OPACITY, towardWhite, GRAPHIC_CONTRAST_FLOOR),
  };
}

export const lightStatusOnPage = createStatusOnPageTones(lightSurfaces.page, false);

export const darkStatusOnPage = createStatusOnPageTones(darkSurfaces.page, true);

export function resolveScaleStatusOnPage(primary: string | null, scheme: ResolvedColorScheme): StatusOnPageTokens {
  return createStatusOnPageTones(resolveScaleSurfaces(primary, scheme).page, scheme === 'dark');
}
