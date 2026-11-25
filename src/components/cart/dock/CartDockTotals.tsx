'use client';

import React from 'react';
import CartTotals from '../CartTotals';
import { useCart } from '../use-cart';

export interface CartDockTotalsProps {
  variant: 'column' | 'sheet';
}

/** O total do rodapé da coluna e do painel: só com a sacola lida e com itens, e sempre o que o servidor devolveu. */
const CartDockTotals: React.FC<CartDockTotalsProps> = ({ variant }) => {
  const { cart, isFetching } = useCart();

  if (!cart || cart.items.length === 0) {
    return null;
  }

  return <CartTotals cart={cart} isFetching={isFetching} variant={variant} />;
};

export default CartDockTotals;
