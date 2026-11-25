'use client';

import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useBoardSession } from '@/providers/board-session';
import { addCartItem, ensureCart } from '@/services/cart';
import { Cart } from '@/types/cart';
import { ProductSelection } from '@/types/product-selection';
import { CART_QUERY_KEY } from './cart-query';

/** Defesa do hook: quem decide se o botão de adicionar aparece é o detalhe do produto, que não deveria ter oferecido. */
export class NoTableForCartError extends Error {
  constructor() {
    super('não há mesa aberta para criar a sacola');
    this.name = 'NoTableForCartError';
  }
}

/** O `POST` de item responde a sacola inteira, não o item criado. */
export function useAddCartItem(): UseMutationResult<Cart, Error, ProductSelection> {
  const queryClient = useQueryClient();
  const session = useBoardSession();
  const movementId = session.status === 'ready' ? session.movement.id : null;

  return useMutation({
    mutationFn: async (selection: ProductSelection) => {
      if (movementId === null) {
        throw new NoTableForCartError();
      }

      const cart = await ensureCart(movementId);

      return addCartItem(cart.id, selection);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] }),
  });
}
