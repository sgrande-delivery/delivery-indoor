'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Cart } from '@/types/cart';
import { CartVariant, cartPanelForms } from './cart-metrics';
import CartItemRow from './CartItemRow';
import { UseCartActions } from './use-cart-actions';

const LIST_LABEL = 'Itens da sacola';

export interface CartItemListProps {
  cart: Cart;
  actions: UseCartActions;
  onRemove: (itemId: number) => void;
  variant?: CartVariant;
}

const List = styled('ul', {
  shouldForwardProp: prop => prop !== 'listGap',
})<{ listGap: number }>(({ listGap }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: listGap,
  margin: 0,
  padding: 0,
}));

const CartItemList: React.FC<CartItemListProps> = ({ cart, actions, onRemove, variant = 'screen' }) => {
  return (
    <List aria-label={LIST_LABEL} listGap={cartPanelForms[variant].listGap}>
      {cart.items.map(item => (
        <CartItemRow
          key={item.id}
          item={item}
          isPending={actions.isPending}
          isSubject={actions.subjectItemId === item.id}
          onQuantityChange={actions.changeQuantity}
          onRemove={onRemove}
          variant={variant}
        />
      ))}
    </List>
  );
};

export default CartItemList;
