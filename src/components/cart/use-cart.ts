'use client';

import { skipToken, useQuery, UseQueryResult } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { useBoardSession } from '@/providers/board-session';
import { fetchStoredCart, isCartUsable, readStoredCartIdFor, subscribeToStoredCart } from '@/services/cart';
import { Cart } from '@/types/cart';
import { CART_QUERY_KEY, cartQueryKey } from './cart-query';

export interface UseCart {
  /** `undefined` é "ainda não sei"; `null` é "não há sacola". */
  cart: Cart | null | undefined;
  query: UseQueryResult<Cart | null>;
  isLoading: boolean;
  /** Há leitura em voo, inclusive a que uma escrita disparou ao invalidar. */
  isFetching: boolean;
  isError: boolean;
  retry: () => void;
}

// Servidor e hidratação não têm `localStorage`: `undefined` separa "ainda não sei" do `null` de quem não tem sacola,
// e sem os dois estados a tela pisca o vazio para quem tem sacola.
function readStoredCartIdOnServer(): undefined {
  return undefined;
}

/**
 * A sacola é `useQuery(['cart', cartId])` e nada mais: o id do `localStorage` é a única cópia local, lida por
 * `useSyncExternalStore`. Sem id a `queryFn` é `skipToken` e a tela é o vazio, sem request.
 *
 * **`retry` relê e nunca cria.** Um `refetch()` com `skipToken` rejeita em vez de ser no-op, então o `retry` só
 * relê quando há id.
 */
export function useCart(): UseCart {
  const session = useBoardSession();
  const movementId = session.status === 'ready' ? session.movement.id : null;
  const storedCartId = useSyncExternalStore<string | null | undefined>(
    subscribeToStoredCart,
    () => readStoredCartIdFor(movementId),
    readStoredCartIdOnServer
  );
  const cartId = session.isLoading ? undefined : storedCartId;

  const query = useQuery({
    queryKey: typeof cartId === 'string' ? cartQueryKey(cartId) : [CART_QUERY_KEY],
    queryFn: typeof cartId === 'string' ? () => fetchStoredCart(cartId) : skipToken,
  });

  function resolveCart(): Cart | null | undefined {
    if (cartId === undefined) {
      return undefined;
    }

    if (cartId === null) {
      return null;
    }

    if (query.data === undefined) {
      return undefined;
    }

    // a sacola que virou pedido em outra aba, ou que expirou, não é sacola
    return query.data !== null && isCartUsable(query.data) ? query.data : null;
  }

  return {
    cart: resolveCart(),
    query,
    isLoading: cartId === undefined || (typeof cartId === 'string' && query.isLoading),
    isFetching: query.isFetching,
    isError: typeof cartId === 'string' && query.isError,
    retry: () => {
      if (typeof cartId !== 'string') {
        return;
      }

      void query.refetch();
    },
  };
}
