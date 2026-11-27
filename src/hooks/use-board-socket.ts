'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { SOCKET_APP } from '@/constants/constants';
import { SocketSnapshot, SocketStore } from '@/store/socket-store';

// Escopo do módulo: dentro do componente seria uma conexão por render. É a única instância do `/board`.
const store = new SocketStore(process.env.NEXT_PUBLIC_SOCKET ?? '', 'board', SOCKET_APP);

/** O socket do `/board` para quem registra o próprio listener com `on`/`off`. Quem conecta é o `BoardRealtime`. */
export function useBoardSocket(): SocketSnapshot {
  return useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store),
    store.getSnapshot.bind(store)
  );
}

/**
 * Conecta quando há restaurante e mesa, e desconecta no cleanup e quando um dos dois muda: o `connect` do store retorna
 * cedo se já há socket, e a conexão nova leva o handshake da sessão nova.
 */
export function useBoardSocketConnection(restaurantUuid: string | undefined, sessionId: string | null): void {
  useEffect(() => {
    if (!restaurantUuid || !sessionId) {
      return undefined;
    }

    store.connect(restaurantUuid);

    return () => {
      store.disconnect();
    };
  }, [restaurantUuid, sessionId]);
}
