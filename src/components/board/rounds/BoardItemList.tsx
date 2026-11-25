'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import type { BoardProductItem } from '@/types/board-bill';
import BoardItemRow from './BoardItemRow';
import { roundsMetrics } from './rounds-metrics';

export interface BoardItemListProps {
  items: readonly BoardProductItem[];
}

const Root = styled('ul')({
  display: 'flex',
  flexDirection: 'column',
  gap: roundsMetrics.itemGap,
  margin: 0,
  paddingBlock: roundsMetrics.itemsPaddingBlock,
  paddingInline: 0,
  listStyle: 'none',
});

const BoardItemList: React.FC<BoardItemListProps> = ({ items }) => {
  return (
    <Root>
      {items.map(item => (
        <BoardItemRow key={item.id} item={item} />
      ))}
    </Root>
  );
};

export default BoardItemList;
