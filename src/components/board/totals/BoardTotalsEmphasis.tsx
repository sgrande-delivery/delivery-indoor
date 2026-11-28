'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { fontFamilies, pxToRem, typographyTokens } from '@/theme';
import { totalsMetrics } from './totals-metrics';

export type BoardTotalsEmphasisTone = 'ink' | 'brand' | 'success';

export interface BoardTotalsEmphasisProps {
  label: string;
  value: string;
  tone?: BoardTotalsEmphasisTone;
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginBlockStart: totalsMetrics.emphasisMarginBlockStart,
  paddingBlockStart: totalsMetrics.emphasisPaddingBlockStart,
  paddingBlockEnd: totalsMetrics.rowPaddingBlock,
  gap: totalsMetrics.labelValueGap,
  borderBlockStart: `${totalsMetrics.ruleHeight}px solid ${theme.vars.palette.surface.line}`,
}));

const Label = styled('dt')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(totalsMetrics.emphasisLabelFontSize),
  fontWeight: totalsMetrics.emphasisLabelWeight,
  color: theme.vars.palette.surface.ink,
}));

const Value = styled('dd', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: BoardTotalsEmphasisTone }>(({ theme, tone }) => ({
  margin: 0,
  ...typographyTokens.h3,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  color:
    tone === 'brand'
      ? theme.vars.palette.brand.text
      : tone === 'success'
        ? theme.vars.palette.toneOnCard.success
        : theme.vars.palette.surface.ink,
}));

const BoardTotalsEmphasis: React.FC<BoardTotalsEmphasisProps> = ({ label, value, tone = 'ink' }) => (
  <Root>
    <Label>{label}</Label>
    <Value tone={tone}>{value}</Value>
  </Root>
);

export default BoardTotalsEmphasis;
