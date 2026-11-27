'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui';
import { restaurantQueryKey } from '@/hooks/use-restaurant';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { useBoardSession } from '@/providers/board-session';
import { randomUuid } from '@/helpers/random-uuid';
import { boardProductsQueryKey } from '@/services/board-bill';
import { boardMovementQueryKey } from '@/services/board-movement';
import {
  checkoutCart,
  forgetStoredCartIf,
  isIdempotencyKeyReusable,
  readStoredCartSessionToken,
} from '@/services/cart';
import { firstName } from '@/services/person-identity';
import { CartItem } from '@/types/cart';
import { PlacedOrder } from '@/types/order';
import { BOARD_ROUTE } from '@/routes/app-routes';
import { Restaurant } from '@/types/restaurant';
import { CART_CLEAR_MUTATION_KEY, cartQueryKey } from './cart-query';
import { ALREADY_SENT_MESSAGE, CART_EXPIRED_MESSAGE, readSendFailure, SendFailure } from './send-failure';
import { getSendState, SendAttempt, setSendState, subscribeToSend } from './send-store';
import { useCart } from './use-cart';

/** O pedido criado e o retrato da sacola que o originou: depois do envio a sacola não existe mais para ser lida. */
export interface SentOrder {
  order: PlacedOrder;
  items: CartItem[];
  itemCount: number;
  personFirstName: string;
  movementId: string;
  /** A sacola consumida: uma sacola de outro id é uma composição nova. */
  cartId: string;
}

const SEE_BILL_LABEL = 'Ver conta da mesa';

export interface SendCallbacks {
  /** O total novo da recusa por preço que o cliente aceitou, em centavos: o corpo leva `accept_price_change`. */
  acceptedTotal?: number | null;
  /** Roda quando a tentativa termina, com sucesso ou não. */
  onSettled?: () => void;
}

export interface UseSendOrder {
  /** Devolve `false` quando recusou: já há envio ou limpeza em voo, está offline ou não há sacola lida. */
  send: (customerName: string, callbacks?: SendCallbacks) => boolean;
  /** Reenvia a tentativa que falhou sem resposta registrada, com a mesma chave e sem depender da sacola lida. */
  retry: () => boolean;
  /** O total aceito que um `send` com este nome reenviaria (a tentativa de rede pendente); `null` sem aceite. */
  acceptedTotalFor: (customerName: string) => number | null;
  isSending: boolean;
  /** A última falha, até a próxima tentativa; `null` sem falha. */
  error: unknown;
  /** Há falha que o "Tentar novamente" ainda resolve: o pedido pode ter entrado e a sacola já não existir. */
  isRetryable: boolean;
  sent: SentOrder | null;
  resetSent: () => void;
}

function findReusableAttempt(attempt: SendAttempt | null, cartId: string, customerName: string): SendAttempt | null {
  return attempt !== null && attempt.cartId === cartId && attempt.customerName === customerName ? attempt : null;
}

/**
 * O envio do pedido para a cozinha. A trava contra o duplo toque e a `Idempotency-Key` vivem no módulo (`send-store`),
 * e não no hook: valem para o aparelho, entre molduras. A chave cobre o retry de rede: a tentativa que terminou sem
 * resposta (ou com 5xx) é reenviada com a mesma chave, e o servidor devolve o mesmo pedido em vez de criar outro;
 * depois de uma resposta registrada, ou com outro nome ou outra sacola, a chave é nova.
 */
export function useSendOrder(): UseSendOrder {
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const session = useBoardSession();
  const isOffline = useIsOffline();
  const { cart } = useCart();
  const sendState = useSyncExternalStore(subscribeToSend, getSendState, getSendState);
  const [sent, setSent] = useState<SentOrder | null>(null);
  const movementId = session.status === 'ready' ? session.movement.id : null;

  const mutation = useMutation({
    retry: 0,
    mutationFn: (attempt: SendAttempt) =>
      checkoutCart(attempt.cartId, attempt.customerName, attempt.key, attempt.sessionToken, {
        acceptPriceChange: attempt.acceptedTotal !== null,
      }),
    onSuccess: (order, attempt) => {
      // a confirmação entra antes de a sacola sumir, no mesmo commit: a troca por store externo é síncrona e, sem isso,
      // a tela piscaria o vazio antes de mostrá-la
      flushSync(() =>
        setSent({
          order,
          items: attempt.items,
          itemCount: attempt.itemCount,
          personFirstName: firstName(order.customer_name || attempt.customerName),
          movementId: attempt.movementId,
          cartId: attempt.cartId,
        })
      );
      forgetStoredCartIf(attempt.cartId);
      queryClient.removeQueries({ queryKey: cartQueryKey(attempt.cartId) });
      void queryClient.invalidateQueries({ queryKey: boardMovementQueryKey(attempt.movementId) });
      void queryClient.invalidateQueries({ queryKey: boardProductsQueryKey(attempt.movementId) });
      setSendState({ attempt: null, isSending: false, error: null });
    },
    // o erro e o fim do spinner mudam juntos: separados, o CTA ficaria um frame sem spinner e sem falha
    onError: (error, attempt) => {
      const failure = readSendFailure(error);

      setSendState({
        attempt: isIdempotencyKeyReusable(error) ? attempt : null,
        isSending: false,
        error: isAnnouncedByToast(failure) ? null : error,
      });

      handleFailure(failure, attempt);
    },
  });

  // O que esvazia a sacola vira toast e não fica preso no rodapé. A da cozinha fica guardada: o rodapé a esconde quando
  // o estado derivado (a trava do CTA) já a diz, e a mostra quando o restaurante não está no cache.
  function isAnnouncedByToast({ kind }: SendFailure): boolean {
    return kind === 'already-sent' || kind === 'cart-expired';
  }

  function forgetCart(attempt: SendAttempt): void {
    forgetStoredCartIf(attempt.cartId);
    queryClient.removeQueries({ queryKey: cartQueryKey(attempt.cartId) });
  }

  function handleFailure({ kind }: SendFailure, attempt: SendAttempt): void {
    if (kind === 'price-changed') {
      // quando uma promoção caiu a sacola converge, e o resumo precisa sair do desconto velho
      void queryClient.invalidateQueries({ queryKey: cartQueryKey(attempt.cartId) });
    }

    if (kind === 'kitchen-closed') {
      // o CTA trava já, sem esperar a releitura; ela confirma, e reabrir destrava
      queryClient.setQueryData<Restaurant>(restaurantQueryKey, current =>
        current ? { ...current, is_kitchen_open: false } : current
      );
      void queryClient.invalidateQueries({ queryKey: restaurantQueryKey });
    }

    if (kind === 'already-sent') {
      forgetCart(attempt);
      void queryClient.invalidateQueries({ queryKey: boardMovementQueryKey(attempt.movementId) });
      void queryClient.invalidateQueries({ queryKey: boardProductsQueryKey(attempt.movementId) });
      toast.show({
        message: ALREADY_SENT_MESSAGE,
        variant: 'info',
        action: { label: SEE_BILL_LABEL, onClick: () => router.push(BOARD_ROUTE) },
      });
    }

    if (kind === 'cart-expired') {
      forgetCart(attempt);
      toast.show({ message: CART_EXPIRED_MESSAGE, variant: 'warning' });
    }
  }

  function run(attempt: SendAttempt, callbacks?: SendCallbacks): boolean {
    // a limpeza apaga item a item: um envio no meio mandaria uma sacola pela metade
    if (getSendState().isSending || isOffline || queryClient.isMutating({ mutationKey: CART_CLEAR_MUTATION_KEY }) > 0) {
      return false;
    }

    setSendState({ attempt, isSending: true, error: null });
    mutation.mutate(attempt, { onSettled: callbacks?.onSettled });

    return true;
  }

  function send(customerName: string, callbacks?: SendCallbacks): boolean {
    if (!cart || cart.items.length === 0 || movementId === null) {
      return false;
    }

    const reused = findReusableAttempt(getSendState().attempt, cart.id, customerName);

    return run(
      {
        cartId: cart.id,
        customerName,
        key: reused?.key ?? randomUuid(),
        sessionToken: readStoredCartSessionToken(cart.id),
        items: cart.items,
        itemCount: cart.items.reduce((count, item) => count + item.quantity, 0),
        movementId,
        // a chave reaproveitada leva o mesmo corpo, o aceite inclusive
        acceptedTotal: reused !== null ? reused.acceptedTotal : (callbacks?.acceptedTotal ?? null),
      },
      callbacks
    );
  }

  // o que o próximo `send` vai levar no corpo, para o CTA mostrar exatamente isso
  function acceptedTotalFor(customerName: string): number | null {
    return cart ? (findReusableAttempt(sendState.attempt, cart.id, customerName)?.acceptedTotal ?? null) : null;
  }

  function retry(): boolean {
    const { attempt } = getSendState();

    return attempt !== null && run(attempt);
  }

  const resetSent = useCallback(() => setSent(null), []);

  return {
    send,
    retry,
    acceptedTotalFor,
    isSending: sendState.isSending,
    error: sendState.error,
    isRetryable: sendState.attempt !== null && sendState.error !== null,
    sent,
    resetSent,
  };
}
