'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { moneyFormat } from '@/helpers/numberFormat';
import { fontFamilies, pxToRem } from '@/theme';
import type { BoardProductItem } from '@/types/board-bill';
import { buildBoardItemComposition, hasBoardItemComposition } from './board-item-composition';
import { describeBoardItemTitle } from './board-item-text';
import BoardItemComposition from './BoardItemComposition';
import BoardItemMeta from './BoardItemMeta';
import BoardItemThumb from './BoardItemThumb';
import { roundsMetrics } from './rounds-metrics';

export interface BoardItemRowProps {
  item: BoardProductItem;
}

interface RootProps {
  hasComposition: boolean;
}

const Root = styled('li', {
  shouldForwardProp: prop => prop !== 'hasComposition',
})<RootProps>(({ hasComposition }) => ({
  display: 'flex',
  alignItems: hasComposition ? 'flex-start' : 'center',
  gap: roundsMetrics.itemRowGap,
  paddingInline: roundsMetrics.cardPaddingInline,
}));

const Body = styled('div')({
  flex: 1,
  minInlineSize: 0,
});

const Name = styled('div')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(roundsMetrics.nameFontSize),
  fontWeight: roundsMetrics.nameWeight,
  lineHeight: roundsMetrics.lineHeight,
  color: theme.vars.palette.surface.ink,
}));

const Price = styled('span')(({ theme }) => ({
  flexShrink: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(roundsMetrics.priceFontSize),
  fontWeight: roundsMetrics.priceWeight,
  color: theme.vars.palette.surface.ink,
}));

/** O item já lançado, somente leitura. O valor da linha é o `final_price` da api: nada é multiplicado aqui. */
const BoardItemRow: React.FC<BoardItemRowProps> = ({ item }) => {
  const composition = buildBoardItemComposition(item);
  const hasComposition = hasBoardItemComposition(composition);

  return (
    <Root hasComposition={hasComposition}>
      <BoardItemThumb image={item.image} categoryKind={item.category_kind} />
      <Body>
        <Name>{describeBoardItemTitle(item)}</Name>
        <BoardItemMeta item={item} />
        {hasComposition && <BoardItemComposition composition={composition} />}
      </Body>
      <Price>{moneyFormat(item.final_price)}</Price>
    </Root>
  );
};

export default BoardItemRow;
