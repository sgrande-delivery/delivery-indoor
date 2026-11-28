'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { fontFamilies, pxToRem } from '@/theme';
import { phoneOnlyStyle, tabletOnlyStyle } from '../layout/format-visibility';
import { totalsMetrics } from './totals-metrics';

export interface BoardTotalsRowProps {
  label: string;
  value: string;
  tone?: 'default' | 'positive';
  /**
   * A linha existe só num formato. É o próprio grupo `dt`/`dd` que se esconde: um `div` de recorte em volta dele não é
   * filho válido de `dl`.
   */
  visibleOn?: 'phone' | 'tablet';
}

const Root = styled('div', {
  shouldForwardProp: prop => prop !== 'visibleOn',
})<{ visibleOn?: 'phone' | 'tablet' }>(({ visibleOn }) => ({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: totalsMetrics.labelValueGap,
  paddingBlock: totalsMetrics.rowPaddingBlock,
  ...(visibleOn === 'phone' && phoneOnlyStyle),
  ...(visibleOn === 'tablet' && tabletOnlyStyle('flex')),
}));

const Label = styled('dt')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(totalsMetrics.rowFontSize),
  fontWeight: totalsMetrics.rowLabelWeight,
  color: theme.vars.palette.surface.muted,
}));

const Value = styled('dd', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'default' | 'positive' }>(({ theme, tone }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(totalsMetrics.rowFontSize),
  flexShrink: 0,
  whiteSpace: 'nowrap',
  fontWeight: totalsMetrics.rowValueWeight,
  color: tone === 'positive' ? theme.vars.palette.toneOnCard.success : theme.vars.palette.surface.ink,
}));

const BoardTotalsRow: React.FC<BoardTotalsRowProps> = ({ label, value, tone = 'default', visibleOn }) => (
  <Root visibleOn={visibleOn}>
    <Label>{label}</Label>
    <Value tone={tone}>{value}</Value>
  </Root>
);

export default BoardTotalsRow;
