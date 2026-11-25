'use client';

import React from 'react';
import BoardItemList from './BoardItemList';
import BoardRoundHeader from './BoardRoundHeader';
import type { BoardRound } from './group-board-rounds';

export interface BoardRoundGroupProps {
  round: BoardRound;
}

const BoardRoundGroup: React.FC<BoardRoundGroupProps> = ({ round }) => {
  return (
    <li>
      <BoardRoundHeader round={round} />
      <BoardItemList items={round.items} />
    </li>
  );
};

export default BoardRoundGroup;
