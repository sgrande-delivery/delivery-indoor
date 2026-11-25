'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import BoardRoundGroup from './BoardRoundGroup';
import type { BoardRound } from './group-board-rounds';
import { roundsMetrics } from './rounds-metrics';

export interface BoardRoundListProps {
  rounds: readonly BoardRound[];
}

const Root = styled('ul')({
  display: 'flex',
  flexDirection: 'column',
  gap: roundsMetrics.groupGap,
  margin: 0,
  marginBlockStart: roundsMetrics.listMarginBlockStart,
  padding: 0,
  listStyle: 'none',
});

const BoardRoundList: React.FC<BoardRoundListProps> = ({ rounds }) => {
  return (
    <Root>
      {rounds.map(round => (
        <BoardRoundGroup key={round.orderPublicId} round={round} />
      ))}
    </Root>
  );
};

export default BoardRoundList;
