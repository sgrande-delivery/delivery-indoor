'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { errorPageMetrics, fontFamilies, pxToRem } from '@/theme';
import { ERROR_PAGE_DESKTOP_QUERY } from './error-page-container';

const LABEL = 'Código';

export interface ErrorPageReferenceProps {
  code: string;
  reference: string | null;
  className?: string;
}

const Root = styled('p')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: errorPageMetrics.reference.gap,
  margin: 0,
  paddingBlock: errorPageMetrics.reference.paddingBlock,
  paddingInline: errorPageMetrics.reference.paddingInline,
  border: `${errorPageMetrics.reference.borderWidth}px solid ${theme.vars.palette.surface.line}`,
  borderRadius: errorPageMetrics.reference.radius,
  backgroundColor: theme.vars.palette.surface.card,
  fontSize: pxToRem(errorPageMetrics.reference.fontSize),
  fontWeight: errorPageMetrics.reference.fontWeight,
  lineHeight: errorPageMetrics.reference.lineHeight,
  color: theme.vars.palette.surface.muted,
  [ERROR_PAGE_DESKTOP_QUERY]: {
    fontSize: pxToRem(errorPageMetrics.desktop.reference.fontSize),
  },
}));

const Code = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.mono,
  fontWeight: errorPageMetrics.reference.codeFontWeight,
  color: theme.vars.palette.surface.ink,
}));

const ErrorPageReference: React.FC<ErrorPageReferenceProps> = ({ code, reference, className }) => {
  return (
    <Root className={className}>
      {LABEL} <Code>{reference ? `${code} · ${reference}` : code}</Code>
    </Root>
  );
};

export default ErrorPageReference;
