'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_APP } from '@/constants/constants';
import { SocketStore } from '@/store/socket-store';
import { restaurantQueryKey } from './use-restaurant';

const KITCHEN_STATE_EVENT = 'kitchen_state_changed';

// Escopo do módulo: dentro do componente seria uma conexão por render.
const store = new SocketStore(process.env.NEXT_PUBLIC_SOCKET ?? '', 'client', SOCKET_APP);

/**
 * O `/client` anuncia a cozinha que abre e fecha. O evento só diz que mudou, e quem diz como está é o `GET /restaurants`,
 * então ele invalida o restaurante em vez de gravar o payload. Não há replay: depois de uma reconexão o estado também é
 * relido. O `handleRestaurantState` (loja aberta ou fechada) não é ouvido, porque nada da mesa lê `is_open`.
 */
export function useRestaurantStateSocket(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    store.connect(process.env.NEXT_PUBLIC_RESTAURANT_UUID);

    const { socket } = store.getSnapshot();

    if (!socket) {
      return undefined;
    }

    let hasDisconnected = false;

    function refreshRestaurant(): void {
      void queryClient.invalidateQueries({ queryKey: restaurantQueryKey });
    }

    // o `connect` do boot não é reconexão: só relê depois de uma queda
    function handleConnect(): void {
      if (hasDisconnected) {
        hasDisconnected = false;
        refreshRestaurant();
      }
    }

    function handleDisconnect(): void {
      hasDisconnected = true;
    }

    socket.on(KITCHEN_STATE_EVENT, refreshRestaurant);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off(KITCHEN_STATE_EVENT, refreshRestaurant);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      store.disconnect();
    };
  }, [queryClient]);
}
