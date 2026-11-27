'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { tabletLandscapeMediaQuery, tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { EmptyState } from '@/components/ui';
import { formatClockTime } from '@/helpers/clock-time';
import { fontFamilies, pxToRem } from '@/theme';
import type { BoardProductItem } from '@/types/board-bill';
import { boardCopy } from '../board-copy';
import { boardMetrics } from '../board-metrics';
import { parseBoardTimestamp } from '../board-time';
import { describeBoardCount, summarizeBoardProducts } from '../board-summary';
import BoardRoundList from './BoardRoundList';
import { groupBoardRounds } from './group-board-rounds';
import { roundsMetrics, roundsTabletMetrics } from './rounds-metrics';

export interface BoardItemsCardProps {
  products: readonly BoardProductItem[];
  /** O resumo de valores, depois do último grupo. */
  footer?: React.ReactNode;
  /** À direita do título, depois do contador: o "Atualizar" do tablet. */
  headerAction?: React.ReactNode;
  /** `paid_at` da conta paga: o contador ganha "· encerrada às HH:mm". */
  closedAt?: string | null;
}

const Root = styled('section')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  overflow: 'hidden',
  paddingBlockEnd: roundsMetrics.cardPaddingBlockEnd,
  borderRadius: boardMetrics.cardRadius,
  boxShadow: boardMetrics.cardShadow,
  backgroundColor: theme.vars.palette.surface.card,
  // deitado o cartão preenche a altura da coluna, e o resumo desce para o pé
  [`@media ${tabletLandscapeMediaQuery}`]: {
    flexGrow: 1,
  },
}));

const TitleRow = styled('div', {
  shouldForwardProp: prop => prop !== 'hasAction',
})<{ hasAction: boolean }>(({ hasAction }) => ({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  paddingBlockStart: roundsMetrics.cardPaddingBlockStart,
  paddingInline: roundsMetrics.cardPaddingInline,
  ...(hasAction && {
    [`@media ${tabletShellMediaQuery}`]: {
      alignItems: 'center',
      paddingBlockStart: roundsTabletMetrics.titlePaddingBlockStartWithAction,
    },
  }),
}));

const Trailing = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  gap: roundsMetrics.headerGap,
  [`@media ${tabletShellMediaQuery}`]: {
    alignItems: 'center',
  },
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

function describeClosedAt(closedAt: string | null | undefined): string | null {
  const timestamp = parseBoardTimestamp(closedAt ?? null);

  return timestamp === null ? null : boardCopy.closedAt(formatClockTime(timestamp));
}

const EmptySlot = styled('div')({
  marginBlockStart: roundsMetrics.emptyMarginBlockStart,
  marginBlockEnd: roundsMetrics.emptyMarginBlockEnd,
  marginInline: roundsMetrics.cardPaddingInline,
});

const BoardItemsCard: React.FC<BoardItemsCardProps> = ({ products, footer, headerAction, closedAt }) => {
  const rounds = groupBoardRounds(products);
  const closed = describeClosedAt(closedAt);
  const count = describeBoardCount(summarizeBoardProducts(products));

  return (
    <Root>
      <TitleRow hasAction={headerAction !== undefined}>
        <Title>{boardCopy.itemsTitle}</Title>
        <Trailing>
          {products.length > 0 && <Count>{closed === null ? count : `${count} · ${closed}`}</Count>}
          {headerAction}
        </Trailing>
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
