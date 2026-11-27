'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBoardSocket, useBoardSocketConnection } from '@/hooks/use-board-socket';
import { useBoardSession } from '@/providers/board-session';
import { useConnectivity } from '@/providers/connectivity/ConnectivityProvider';
import { restaurantUuid } from '@/services/restaurant-header';
import { ALL_BOARD_BILL_KEYS, resolveBoardBillQueryKeys } from './board-bill-keys';
import { BOARD_EVENT_INVALIDATIONS, BOARD_SOCKET_EVENTS } from './board-socket-events';
import { createInvalidationBatcher } from './invalidation-batcher';

const SUBSCRIBE_EVENT = 'subscribe_channel';
const COALESCE_MS = 250;
const SERVER_DISCONNECT = 'io server disconnect';
const CLIENT_DISCONNECT = 'io client disconnect';

/**
 * A conta ao vivo. A conexão e a sala da movimentação existem enquanto a sessão está `ready`, em toda rota. Todo evento só
 * invalida (nenhum payload é lido, nenhum delta é aplicado) e passa por um coalescedor de borda final.
 */
export function useBoardRealtime(): void {
  const session = useBoardSession();
  const queryClient = useQueryClient();
  const { reportConnectionLost } = useConnectivity();
  const sessionId = session.status === 'ready' ? session.sessionId : null;

  useBoardSocketConnection(restaurantUuid, sessionId);

  const { socket } = useBoardSocket();

  useEffect(() => {
    if (!socket || !sessionId) {
      return undefined;
    }

    const batcher = createInvalidationBatcher(groups => {
      for (const queryKey of resolveBoardBillQueryKeys(sessionId, groups)) {
        void queryClient.invalidateQueries({ queryKey });
      }
    }, COALESCE_MS);

    let hasDisconnected = false;

    function handleConnect(): void {
      socket?.emit(SUBSCRIBE_EVENT, sessionId);

      if (hasDisconnected) {
        hasDisconnected = false;
        batcher.schedule(ALL_BOARD_BILL_KEYS);
      }
    }

    function handleDisconnect(reason: string): void {
      hasDisconnected = true;

      // O cleanup do `useBoardSocketConnection` roda antes do deste efeito: o próprio `disconnect()` chega aqui, e não é queda.
      if (reason === CLIENT_DISCONNECT) {
        return;
      }

      if (reason === SERVER_DISCONNECT) {
        batcher.schedule(['movement']);

        return;
      }

      reportConnectionLost();
    }

    const handlers = Object.values(BOARD_SOCKET_EVENTS).map(event => ({
      event,
      handler: (): void => batcher.schedule(BOARD_EVENT_INVALIDATIONS[event]),
    }));

    for (const { event, handler } of handlers) {
      socket.on(event, handler);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      for (const { event, handler } of handlers) {
        socket.off(event, handler);
      }

      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      batcher.cancel();
    };
  }, [socket, sessionId, queryClient, reportConnectionLost]);
}
