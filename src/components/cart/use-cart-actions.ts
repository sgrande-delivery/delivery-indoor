'use client';

import { RefObject } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui';
import { isCartAlreadyCheckedOut, isCartNotFound, removeCartItem, updateCartItemQuantity } from '@/services/cart';
import { CART_QUERY_KEY } from './cart-query';

const QUANTITY_ERROR = 'Não foi possível mudar a quantidade. Tente de novo.';
const REMOVE_ERROR = 'Não foi possível remover este item. Tente de novo.';
const REMOVE_SUCCESS = 'Item removido da sacola.';

interface ChangeQuantityInput {
  itemId: number;
  quantity: number;
}

export interface UseCartActionsOptions {
  /** De onde os avisos sobem: a linha no limite inferior do corpo, que fica acima do rodapé da sacola. */
  anchorRef?: RefObject<HTMLElement>;
}

export interface UseCartActions {
  /**
   * A barreira, e é ela que desenha os controles: as escritas mexem na mesma sacola e todas releem ao terminar,
   * então enquanto uma está em voo nenhuma outra dispara.
   */
  isPending: boolean;
  /** O item que é o assunto da escrita em voo. Só serve ao `aria-busy` da linha dele. */
  subjectItemId: number | null;
  changeQuantity: (itemId: number, quantity: number) => void;
  remove: (itemId: number, onRemoved: () => void) => void;
}

/**
 * As escritas da sacola. Nenhuma alimenta o cache com o que respondeu: invalidar `['cart']` e reler é o que impede
 * a tela de recompor total no cliente. O `onSuccess` devolve a promessa da invalidação, então a mutação só assenta
 * depois de o `GET /cart` responder, e a linha some junto com o redesenho.
 */
export function useCartActions({ anchorRef }: UseCartActionsOptions = {}): UseCartActions {
  const queryClient = useQueryClient();
  const toast = useToast();

  function invalidateCart(): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
  }

  // A sacola que o servidor não tem mais ou que já virou pedido: reler esquece o guardado e a tela mostra o vazio.
  function handleWriteError(error: unknown, message: string): void {
    if (isCartNotFound(error) || isCartAlreadyCheckedOut(error)) {
      void invalidateCart();
    }

    toast.show({ message, variant: 'error', anchorRef });
  }

  const quantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: ChangeQuantityInput) => updateCartItemQuantity(itemId, quantity),
    onSuccess: invalidateCart,
    onError: error => handleWriteError(error, QUANTITY_ERROR),
  });

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: invalidateCart,
    onError: error => handleWriteError(error, REMOVE_ERROR),
  });

  const isPending = quantityMutation.isPending || removeMutation.isPending;

  function resolveSubjectItemId(): number | null {
    if (quantityMutation.isPending) {
      return quantityMutation.variables?.itemId ?? null;
    }

    if (removeMutation.isPending) {
      return removeMutation.variables ?? null;
    }

    return null;
  }

  function changeQuantity(itemId: number, quantity: number): void {
    if (isPending) {
      return;
    }

    quantityMutation.mutate({ itemId, quantity });
  }

  function remove(itemId: number, onRemoved: () => void): void {
    if (isPending) {
      return;
    }

    removeMutation.mutate(itemId, {
      onSuccess: () => {
        toast.show({ message: REMOVE_SUCCESS, variant: 'success', anchorRef });
        onRemoved();
      },
    });
  }

  return { isPending, subjectItemId: resolveSubjectItemId(), changeQuantity, remove };
}
