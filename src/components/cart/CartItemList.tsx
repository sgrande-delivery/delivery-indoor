'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { cartScreenMetrics } from '@/theme';
import { Cart } from '@/types/cart';
import CartItemRow from './CartItemRow';
import { UseCartActions } from './use-cart-actions';

const LIST_LABEL = 'Itens da sacola';

export interface CartItemListProps {
  cart: Cart;
  actions: UseCartActions;
  onRemove: (itemId: number) => void;
}

const List = styled('ul')({
  display: 'flex',
  flexDirection: 'column',
  gap: cartScreenMetrics.listGap,
  margin: 0,
  padding: 0,
});

const CartItemList: React.FC<CartItemListProps> = ({ cart, actions, onRemove }) => {
  return (
    <List aria-label={LIST_LABEL}>
      {cart.items.map(item => (
        <CartItemRow
          key={item.id}
          item={item}
          isPending={actions.isPending}
          isSubject={actions.subjectItemId === item.id}
          onQuantityChange={actions.changeQuantity}
          onRemove={onRemove}
        />
      ))}
    </List>
  );
};

export default CartItemList;
