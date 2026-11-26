'use client';

import { useRestaurant } from '@/hooks/use-restaurant';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { KITCHEN_CLOSED_MESSAGE } from './send-failure';

export type SendBlockKind = 'offline' | 'kitchen-closed';

export interface SendBlock {
  kind: SendBlockKind;
  message: string;
}

const OFFLINE_MESSAGE = 'Envio indisponível sem conexão. Chame o garçom para pedir.';

/**
 * O motivo que trava o CTA antes do toque, derivado do estado e nunca guardado: a cozinha que reabre destrava na hora.
 * Só a cozinha trava o pedido de mesa, e não `is_open`: a loja que pausa a entrega continua recebendo o salão. O
 * restaurante não lido, ou com erro, não trava: quem decide é o servidor.
 */
export function useSendBlock(): SendBlock | null {
  const isOffline = useIsOffline();
  const restaurant = useRestaurant();

  if (isOffline) {
    return { kind: 'offline', message: OFFLINE_MESSAGE };
  }

  if (restaurant.data?.is_kitchen_open === false) {
    return { kind: 'kitchen-closed', message: KITCHEN_CLOSED_MESSAGE };
  }

  return null;
}
