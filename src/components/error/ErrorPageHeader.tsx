'use client';

import React from 'react';
import Image from 'next/image';
import { styled } from '@mui/material/styles';
import { errorPageMetrics, fontFamilies, pxToRem } from '@/theme';
import { ERROR_PAGE_DESKTOP_QUERY } from './error-page-container';

const LOGO_SIZES = `${errorPageMetrics.desktop.header.logoSize}px`;

const Root = styled('header')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: errorPageMetrics.header.gap,
  paddingBlockStart: errorPageMetrics.header.paddingBlockStart,
  paddingInline: errorPageMetrics.header.paddingInline,
  paddingBlockEnd: errorPageMetrics.header.paddingBlockEnd,
  [ERROR_PAGE_DESKTOP_QUERY]: {
    boxSizing: 'content-box',
    blockSize: errorPageMetrics.desktop.header.blockSize,
    gap: errorPageMetrics.desktop.header.gap,
    paddingBlock: 0,
    paddingInline: errorPageMetrics.desktop.header.paddingInline,
    backgroundColor: theme.vars.palette.surface.card,
    borderBlockEnd: `${errorPageMetrics.desktop.header.borderWidth}px solid ${theme.vars.palette.surface.line}`,
  },
}));

const LogoFrame = styled('span')({
  position: 'relative',
  display: 'block',
  flexShrink: 0,
  inlineSize: errorPageMetrics.header.logoSize,
  blockSize: errorPageMetrics.header.logoSize,
  borderRadius: errorPageMetrics.header.logoRadius,
  overflow: 'hidden',
  [ERROR_PAGE_DESKTOP_QUERY]: {
    inlineSize: errorPageMetrics.desktop.header.logoSize,
    blockSize: errorPageMetrics.desktop.header.logoSize,
    borderRadius: errorPageMetrics.desktop.header.logoRadius,
  },
});

const Logo = styled(Image)({
  objectFit: 'cover',
});

const Name = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(errorPageMetrics.header.nameFontSize),
  fontWeight: errorPageMetrics.header.nameFontWeight,
  lineHeight: errorPageMetrics.header.nameLineHeight,
  color: theme.vars.palette.surface.ink,
  [ERROR_PAGE_DESKTOP_QUERY]: {
    fontSize: pxToRem(errorPageMetrics.desktop.header.nameFontSize),
  },
}));

export interface ErrorPageHeaderProps {
  logoUrl: string | null;
  name: string | null;
}

const ErrorPageHeader: React.FC<ErrorPageHeaderProps> = ({ logoUrl, name }) => {
  if (!logoUrl && !name) {
    return null;
  }

  return (
    <Root>
      {logoUrl && (
        <LogoFrame>
          <Logo src={logoUrl} alt="" fill sizes={LOGO_SIZES} priority />
        </LogoFrame>
      )}
      {name && <Name>{name}</Name>}
    </Root>
  );
};

export default ErrorPageHeader;
