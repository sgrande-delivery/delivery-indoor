'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import {
  tabletLandscapeMediaQuery,
  tabletPortraitShellMediaQuery,
  tabletShellMediaQuery,
} from '@/components/shell/shell-metrics';
import { fontFamilies, fontWeights, pxToRem } from '@/theme';
import { billCardMetrics } from './bill-card-metrics';

export interface BillTimeRowProps {
  label: string;
  value: string;
  aside: string | null;
  /**
   * No tablet a linha vira um contador solto, sem ladrilho nem régua: no canto do card deitado ("schedule 1h 24min") e
   * numa frase embaixo do card em pé ("Mesa ocupada há 1h 24min · desde 19:05"). No celular segue o rodapé de sempre.
   */
  compactOnTablet?: boolean;
  className?: string;
}

interface CompactProps {
  compactOnTablet: boolean;
}

const COMPACT_PROP = { shouldForwardProp: (prop: PropertyKey) => prop !== 'compactOnTablet' };

const Root = styled(
  'div',
  COMPACT_PROP
)<CompactProps>(({ theme, compactOnTablet }) => ({
  display: 'flex',
  alignSelf: 'stretch',
  alignItems: 'center',
  gap: billCardMetrics.timeRowGap,
  marginBlockStart: billCardMetrics.timeRowMarginBlockStart,
  paddingBlockStart: billCardMetrics.timeRowPaddingBlockStart,
  borderBlockStart: `${billCardMetrics.ruleHeight}px solid ${theme.vars.palette.surface.line}`,
  textAlign: 'start',
  ...(compactOnTablet && {
    [`@media ${tabletShellMediaQuery}`]: {
      alignSelf: 'center',
      gap: 0,
      margin: 0,
      padding: 0,
      border: 0,
    },
  }),
}));

const Tile = styled(
  'span',
  COMPACT_PROP
)<CompactProps>(({ theme, compactOnTablet }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  inlineSize: billCardMetrics.timeTileSize,
  blockSize: billCardMetrics.timeTileSize,
  borderRadius: billCardMetrics.timeTileRadius,
  backgroundColor: theme.vars.palette.surface.field,
  color: theme.vars.palette.surface.muted,
  ...(compactOnTablet && {
    [`@media ${tabletShellMediaQuery}`]: {
      inlineSize: 'auto',
      blockSize: 'auto',
      marginInlineEnd: billCardMetrics.tabletCounterGap,
      borderRadius: 0,
      backgroundColor: 'transparent',
    },
  }),
}));

const Texts = styled(
  'div',
  COMPACT_PROP
)<CompactProps>(({ compactOnTablet }) => ({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minInlineSize: 0,
  ...(compactOnTablet && {
    [`@media ${tabletShellMediaQuery}`]: {
      flex: '0 1 auto',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      columnGap: billCardMetrics.tabletCounterTextGap,
    },
  }),
}));

const Label = styled(
  'span',
  COMPACT_PROP
)<CompactProps>(({ theme, compactOnTablet }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.timeLabelFontSize),
  fontWeight: billCardMetrics.timeLabelWeight,
  letterSpacing: billCardMetrics.timeLabelLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.muted,
  ...(compactOnTablet && {
    // deitado o contador é só o ícone e o tempo
    [`@media ${tabletLandscapeMediaQuery}`]: {
      display: 'none',
    },
    [`@media ${tabletPortraitShellMediaQuery}`]: {
      fontSize: pxToRem(billCardMetrics.tabletCounterFontSize),
      fontWeight: fontWeights.regular,
      letterSpacing: 'normal',
      textTransform: 'none',
    },
  }),
}));

const Value = styled(
  'span',
  COMPACT_PROP
)<CompactProps>(({ theme, compactOnTablet }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.timeValueFontSize),
  fontWeight: billCardMetrics.timeValueWeight,
  color: theme.vars.palette.surface.ink,
  ...(compactOnTablet && {
    [`@media ${tabletLandscapeMediaQuery}`]: {
      fontSize: pxToRem(billCardMetrics.tabletCounterFontSize),
      fontWeight: billCardMetrics.timeRangeWeight,
      color: theme.vars.palette.surface.muted,
    },
    [`@media ${tabletPortraitShellMediaQuery}`]: {
      fontSize: pxToRem(billCardMetrics.tabletCounterFontSize),
    },
  }),
}));

const Aside = styled(
  'span',
  COMPACT_PROP
)<CompactProps>(({ theme, compactOnTablet }) => ({
  flexShrink: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.timeRangeFontSize),
  fontWeight: billCardMetrics.timeRangeWeight,
  color: theme.vars.palette.surface.muted,
  ...(compactOnTablet && {
    [`@media ${tabletLandscapeMediaQuery}`]: {
      display: 'none',
    },
    [`@media ${tabletPortraitShellMediaQuery}`]: {
      flexShrink: 1,
      marginInlineStart: billCardMetrics.tabletCounterAsideGap,
      fontSize: pxToRem(billCardMetrics.tabletCounterFontSize),
      fontWeight: fontWeights.regular,
      '&::before': {
        content: '"· "',
      },
    },
  }),
}));

const BillTimeRow: React.FC<BillTimeRowProps> = ({ label, value, aside, compactOnTablet = false, className }) => {
  return (
    <Root compactOnTablet={compactOnTablet} className={className}>
      <Tile compactOnTablet={compactOnTablet}>
        <Icon name="schedule" size={billCardMetrics.timeTileIconSize} />
      </Tile>
      <Texts compactOnTablet={compactOnTablet}>
        <Label compactOnTablet={compactOnTablet}>{label}</Label>
        <Value compactOnTablet={compactOnTablet}>{value}</Value>
      </Texts>
      {aside !== null && <Aside compactOnTablet={compactOnTablet}>{aside}</Aside>}
    </Root>
  );
};

export default BillTimeRow;
