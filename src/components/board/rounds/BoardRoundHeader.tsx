'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { fontFamilies, pxToRem } from '@/theme';
import { formatBoardClock } from '../board-time';
import RoundStatusPill from '../RoundStatusPill';
import { describeBoardRoundTitle } from './board-item-text';
import type { BoardRound } from './group-board-rounds';
import { roundsMetrics } from './rounds-metrics';

export interface BoardRoundHeaderProps {
  round: Pick<BoardRound, 'round' | 'status' | 'orderedAt'>;
}

const Root = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: roundsMetrics.headerGap,
  paddingInline: roundsMetrics.cardPaddingInline,
});

const Title = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(roundsMetrics.headerFontSize),
  fontWeight: roundsMetrics.headerWeight,
  letterSpacing: roundsMetrics.headerLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.muted,
}));

const Rule = styled('span')(({ theme }) => ({
  flex: 1,
  blockSize: roundsMetrics.ruleHeight,
  backgroundColor: theme.vars.palette.surface.line,
}));

const BoardRoundHeader: React.FC<BoardRoundHeaderProps> = ({ round }) => {
  const clock = formatBoardClock(round.orderedAt, new Date());

  return (
    <Root>
      <Title>{describeBoardRoundTitle(round.round, clock)}</Title>
      <Rule aria-hidden />
      {round.status !== null && <RoundStatusPill status={round.status} />}
    </Root>
  );
};

export default BoardRoundHeader;
