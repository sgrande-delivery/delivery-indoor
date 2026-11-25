'use client';

import { useCart } from './use-cart';

/** A soma das quantidades, ou `undefined` enquanto a sacola nunca foi lida: sem resposta, sem afirmação. */
export function useCartItemCount(): number | undefined {
  const { cart } = useCart();

  if (cart === undefined) {
    return undefined;
  }

  return cart === null ? 0 : cart.items.reduce((count, item) => count + item.quantity, 0);
}
