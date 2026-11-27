'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { fontFamilies, pxToRem } from '@/theme';
import type { BoardProductItem } from '@/types/board-bill';
import { describeBoardItemMeta } from './board-item-text';
import { roundsMetrics, roundsTabletMetrics } from './rounds-metrics';

export interface BoardItemMetaProps {
  item: Pick<BoardProductItem, 'amount' | 'person' | 'price'>;
}

const Root = styled('div')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(roundsMetrics.metaFontSize),
  lineHeight: roundsMetrics.lineHeight,
  color: theme.vars.palette.surface.muted,
  [`@media ${tabletShellMediaQuery}`]: {
    fontSize: pxToRem(roundsTabletMetrics.metaFontSize),
  },
}));

const BoardItemMeta: React.FC<BoardItemMetaProps> = ({ item }) => {
  const meta = describeBoardItemMeta(item);

  if (meta === null) {
    return null;
  }

  return <Root>{meta}</Root>;
};

export default BoardItemMeta;
