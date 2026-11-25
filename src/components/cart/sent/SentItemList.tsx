'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { CartItem } from '@/types/cart';
import SentItemRow from './SentItemRow';

const LIST_LABEL = 'Itens enviados';

export interface SentItemListProps {
  items: CartItem[];
}

const List = styled('ul')({
  margin: 0,
  padding: 0,
});

const SentItemList: React.FC<SentItemListProps> = ({ items }) => {
  return (
    <List aria-label={LIST_LABEL}>
      {items.map(item => (
        <SentItemRow key={item.id} item={item} />
      ))}
    </List>
  );
};

export default SentItemList;
