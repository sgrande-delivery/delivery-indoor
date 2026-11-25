'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { EmptyState } from '@/components/ui';
import { fontFamilies, pxToRem } from '@/theme';
import type { BoardProductItem } from '@/types/board-bill';
import { boardCopy } from '../board-copy';
import { boardMetrics } from '../board-metrics';
import { describeBoardCount, summarizeBoardProducts } from '../board-summary';
import BoardRoundList from './BoardRoundList';
import { groupBoardRounds } from './group-board-rounds';
import { roundsMetrics } from './rounds-metrics';

export interface BoardItemsCardProps {
  products: readonly BoardProductItem[];
  /** O resumo de valores, depois do último grupo. */
  footer?: React.ReactNode;
}

const Root = styled('section')(({ theme }) => ({
  flexShrink: 0,
  overflow: 'hidden',
  paddingBlockEnd: roundsMetrics.cardPaddingBlockEnd,
  borderRadius: boardMetrics.cardRadius,
  boxShadow: boardMetrics.cardShadow,
  backgroundColor: theme.vars.palette.surface.card,
}));

const TitleRow = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  paddingBlockStart: roundsMetrics.cardPaddingBlockStart,
  paddingInline: roundsMetrics.cardPaddingInline,
});

const Title = styled('h2')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(roundsMetrics.titleFontSize),
  fontWeight: roundsMetrics.titleWeight,
  color: theme.vars.palette.surface.ink,
}));

const Count = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(roundsMetrics.countFontSize),
  color: theme.vars.palette.surface.muted,
}));

const EmptySlot = styled('div')({
  marginBlockStart: roundsMetrics.emptyMarginBlockStart,
  marginBlockEnd: roundsMetrics.emptyMarginBlockEnd,
  marginInline: roundsMetrics.cardPaddingInline,
});

const BoardItemsCard: React.FC<BoardItemsCardProps> = ({ products, footer }) => {
  const rounds = groupBoardRounds(products);

  return (
    <Root>
      <TitleRow>
        <Title>{boardCopy.itemsTitle}</Title>
        {products.length > 0 && <Count>{describeBoardCount(summarizeBoardProducts(products))}</Count>}
      </TitleRow>
      {rounds.length > 0 ? (
        <BoardRoundList rounds={rounds} />
      ) : (
        <EmptySlot>
          <EmptyState
            variant="compact"
            icon="receipt_long"
            title={boardCopy.itemsEmptyTitle}
            description={boardCopy.itemsEmptyDescription}
          />
        </EmptySlot>
      )}
      {footer}
    </Root>
  );
};

export default BoardItemsCard;
