'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { fontFamilies, pxToRem } from '@/theme';
import { billCardMetrics } from './bill-card-metrics';

export interface BillTimeRowProps {
  label: string;
  value: string;
  aside: string | null;
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  alignSelf: 'stretch',
  alignItems: 'center',
  gap: billCardMetrics.timeRowGap,
  marginBlockStart: billCardMetrics.timeRowMarginBlockStart,
  paddingBlockStart: billCardMetrics.timeRowPaddingBlockStart,
  borderBlockStart: `${billCardMetrics.ruleHeight}px solid ${theme.vars.palette.surface.line}`,
  textAlign: 'start',
}));

const Tile = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  inlineSize: billCardMetrics.timeTileSize,
  blockSize: billCardMetrics.timeTileSize,
  borderRadius: billCardMetrics.timeTileRadius,
  backgroundColor: theme.vars.palette.surface.field,
  color: theme.vars.palette.surface.muted,
}));

const Texts = styled('div')({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minInlineSize: 0,
});

const Label = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.timeLabelFontSize),
  fontWeight: billCardMetrics.timeLabelWeight,
  letterSpacing: billCardMetrics.timeLabelLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.muted,
}));

const Value = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.timeValueFontSize),
  fontWeight: billCardMetrics.timeValueWeight,
  color: theme.vars.palette.surface.ink,
}));

const Aside = styled('span')(({ theme }) => ({
  flexShrink: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.timeRangeFontSize),
  fontWeight: billCardMetrics.timeRangeWeight,
  color: theme.vars.palette.surface.muted,
}));

const BillTimeRow: React.FC<BillTimeRowProps> = ({ label, value, aside }) => {
  return (
    <Root>
      <Tile>
        <Icon name="schedule" size={billCardMetrics.timeTileIconSize} />
      </Tile>
      <Texts>
        <Label>{label}</Label>
        <Value>{value}</Value>
      </Texts>
      {aside !== null && <Aside>{aside}</Aside>}
    </Root>
  );
};

export default BillTimeRow;
