'use client';

import React from 'react';
import { styled, Theme } from '@mui/material/styles';
import Icon from '@/components/ui/Icon';
import { IconName } from '@/components/ui/icon-names';
import { errorPageMetrics, fontFamilies, pxToRem } from '@/theme';
import { ERROR_PAGE_DESKTOP_QUERY } from './error-page-container';

export type ErrorPageVariant = 'not-found' | 'server-error';

interface CodeContent {
  leadingDigit: string;
  trailingDigit: string;
  icon: IconName;
  iconSize: number;
  desktopIconSize: number;
}

interface CodeSkin {
  digitColor: string;
  circleBackground: string;
  glyphColor: string;
  circleShadow: string;
  desktopCircleShadow: string;
}

interface VariantProps {
  variant: ErrorPageVariant;
}

export interface ErrorPageCodeProps extends VariantProps {
  className?: string;
}

const contents: Record<ErrorPageVariant, CodeContent> = {
  'not-found': {
    leadingDigit: '4',
    trailingDigit: '4',
    icon: 'search_off',
    iconSize: errorPageMetrics.code.notFound.iconSize,
    desktopIconSize: errorPageMetrics.desktop.code.notFound.iconSize,
  },
  'server-error': {
    leadingDigit: '5',
    trailingDigit: '0',
    icon: 'soup_kitchen',
    iconSize: errorPageMetrics.code.serverError.iconSize,
    desktopIconSize: errorPageMetrics.desktop.code.serverError.iconSize,
  },
};

const skins: Record<ErrorPageVariant, (theme: Theme) => CodeSkin> = {
  'not-found': theme => ({
    digitColor: theme.vars.palette.brand.text,
    circleBackground: theme.vars.palette.surface.card,
    glyphColor: theme.vars.palette.toneOnCard.brandGlyph,
    circleShadow: errorPageMetrics.code.notFound.circleShadow,
    desktopCircleShadow: errorPageMetrics.desktop.code.notFound.circleShadow,
  }),
  'server-error': theme => ({
    digitColor: theme.vars.palette.surface.ink,
    circleBackground: `rgba(${theme.vars.palette.error.mainChannel} / ${errorPageMetrics.code.serverError.washOpacity})`,
    glyphColor: theme.vars.palette.statusOnPage.dangerGlyph,
    circleShadow: 'none',
    desktopCircleShadow: 'none',
  }),
};

const shouldForwardProp = (prop: PropertyKey) => prop !== 'variant';

const Root = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const Digit = styled('span', { shouldForwardProp })<VariantProps>(({ theme, variant }) => ({
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(errorPageMetrics.code.digitFontSize),
  fontWeight: errorPageMetrics.code.digitFontWeight,
  lineHeight: errorPageMetrics.code.digitLineHeight,
  letterSpacing: errorPageMetrics.code.digitLetterSpacing,
  color: skins[variant](theme).digitColor,
  [ERROR_PAGE_DESKTOP_QUERY]: {
    fontSize: pxToRem(errorPageMetrics.desktop.code.digitFontSize),
    letterSpacing: errorPageMetrics.desktop.code.digitLetterSpacing,
  },
}));

const Circle = styled('span', { shouldForwardProp })<VariantProps>(({ theme, variant }) => {
  const skin = skins[variant](theme);

  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    inlineSize: errorPageMetrics.code.circleSize,
    blockSize: errorPageMetrics.code.circleSize,
    marginInline: errorPageMetrics.code.circleMarginInline,
    borderRadius: '50%',
    backgroundColor: skin.circleBackground,
    color: skin.glyphColor,
    boxShadow: skin.circleShadow,
    [ERROR_PAGE_DESKTOP_QUERY]: {
      inlineSize: errorPageMetrics.desktop.code.circleSize,
      blockSize: errorPageMetrics.desktop.code.circleSize,
      marginInline: errorPageMetrics.desktop.code.circleMarginInline,
      boxShadow: skin.desktopCircleShadow,
    },
  };
});

const Glyph = styled(Icon, { shouldForwardProp })<VariantProps>(({ variant }) => ({
  [ERROR_PAGE_DESKTOP_QUERY]: {
    fontSize: contents[variant].desktopIconSize,
  },
}));

const ErrorPageCode: React.FC<ErrorPageCodeProps> = ({ variant, className }) => {
  const content = contents[variant];

  return (
    <Root className={className} aria-hidden>
      <Digit variant={variant}>{content.leadingDigit}</Digit>
      <Circle variant={variant}>
        <Glyph variant={variant} name={content.icon} size={content.iconSize} />
      </Circle>
      <Digit variant={variant}>{content.trailingDigit}</Digit>
    </Root>
  );
};

export default ErrorPageCode;
