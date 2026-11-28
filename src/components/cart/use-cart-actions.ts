'use client';

import { RefObject } from 'react';
import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import {
  isCartAlreadyCheckedOut,
  isCartItemNotFound,
  isCartNotFound,
  removeCartItem,
  updateCartItemQuantity,
} from '@/services/cart';
import { dismissAnsweredFailure, getSendState } from './send-store';
import { CART_CLEAR_MUTATION_KEY, CART_QUERY_KEY, CART_WRITE_MUTATION_KEY } from './cart-query';

const QUANTITY_ERROR = 'Não foi possível mudar a quantidade. Tente de novo.';
const REMOVE_ERROR = 'Não foi possível remover este item. Tente de novo.';
const REMOVE_SUCCESS = 'Item removido da sacola.';
const CLEAR_SUCCESS = 'Sacola limpa.';
const CLEAR_PARTIAL_ERROR = 'Não foi possível limpar a sacola inteira. Veja o que ficou.';

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
   * então enquanto uma está em voo, em qualquer moldura, nenhuma outra dispara. Offline também a liga: a escrita
   * nasceria pausada e dispararia sozinha quando a rede voltasse.
   */
  isPending: boolean;
  /** A limpeza está em voo; é uma escrita, então `isPending` também vale. */
  isClearing: boolean;
  /** O item que é o assunto da escrita em voo. Só serve ao `aria-busy` da linha dele. */
  subjectItemId: number | null;
  changeQuantity: (itemId: number, quantity: number) => void;
  remove: (itemId: number, onRemoved: () => void) => void;
  /** Apaga em série os itens da sacola **lida**: o que chegou depois, de outra aba, fica e a releitura mostra. */
  clear: (itemIds: number[]) => void;
}

/**
 * As escritas da sacola. Nenhuma alimenta o cache com o que respondeu: invalidar `['cart']` e reler é o que impede
 * a tela de recompor total no cliente. O `onSuccess` devolve a promessa da invalidação, então a mutação só assenta
 * depois de o `GET /cart` responder, e a linha some junto com o redesenho.
 */
export function useCartActions({ anchorRef }: UseCartActionsOptions = {}): UseCartActions {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isOffline = useIsOffline();

  function onRemoveSucceeded(): Promise<void> {
    dismissAnsweredFailure('removal');

    return invalidateCart();
  }

  function onQuantitySucceeded(): Promise<void> {
    dismissAnsweredFailure('change');

    return invalidateCart();
  }

  function invalidateCart(): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
  }

  // A sacola que o servidor não tem mais ou que já virou pedido: reler esquece o guardado e a tela mostra o vazio.
  function handleWriteError(error: unknown, message: string): void {
    if (isCartNotFound(error) || isCartItemNotFound(error) || isCartAlreadyCheckedOut(error)) {
      void invalidateCart();
    }

    toast.show({ message, variant: 'error', anchorRef });
  }

  const quantityMutation = useMutation({
    mutationKey: CART_WRITE_MUTATION_KEY,
    mutationFn: ({ itemId, quantity }: ChangeQuantityInput) => updateCartItemQuantity(itemId, quantity),
    onSuccess: onQuantitySucceeded,
    onError: error => handleWriteError(error, QUANTITY_ERROR),
  });

  const removeMutation = useMutation({
    mutationKey: CART_WRITE_MUTATION_KEY,
    mutationFn: removeCartItem,
    onSuccess: onRemoveSucceeded,
    onError: error => handleWriteError(error, REMOVE_ERROR),
  });

  // Não há rota de esvaziar: um `DELETE` por item, em série. Para no primeiro que falha, e a releitura mostra o que
  // sobrou, que é o sucesso parcial. Os avisos são da mutação, e não do `mutate`: a sacola esvaziada desmonta o botão
  // que a disparou, e o callback do `mutate` morre com ele. O aviso sai **depois** da releitura, para o `Toast` medir
  // a âncora com o rodapé já desmontado (sacola vazia) ou ainda lá (sobrou item).
  const clearMutation = useMutation({
    mutationKey: CART_CLEAR_MUTATION_KEY,
    mutationFn: async (itemIds: number[]) => {
      for (const itemId of itemIds) {
        await removeCartItem(itemId);
        dismissAnsweredFailure('removal');
      }
    },
    onSuccess: async () => {
      await invalidateCart();
      toast.show({ message: CLEAR_SUCCESS, variant: 'success', anchorRef });
    },
    onError: async () => {
      await invalidateCart();
      toast.show({ message: CLEAR_PARTIAL_ERROR, variant: 'error', anchorRef });
    },
  });

  const isPending = useIsMutating({ mutationKey: CART_WRITE_MUTATION_KEY }) > 0 || isOffline;
  const isClearing = useIsMutating({ mutationKey: CART_CLEAR_MUTATION_KEY }) > 0;

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

  function clear(itemIds: number[]): void {
    // a guarda é do hook, e não só da tela: o envio em voo leu a sacola inteira
    if (isPending || getSendState().isSending || itemIds.length === 0) {
      return;
    }

    clearMutation.mutate(itemIds);
  }

  return { isPending, isClearing, subjectItemId: resolveSubjectItemId(), changeQuantity, remove, clear };
}
