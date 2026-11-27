'use client';

import { useEffect, useReducer } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { attendanceCopy } from '@/components/board/actions/attendance-copy';
import { isWaiterCallActive, resolveWaiterCallEnd } from '@/components/board/actions/waiter-call-window';
import { useBoardSession } from '@/providers/board-session';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { requestWaiterCall, waiterCallMutationKey } from '@/services/board-attendance';
import { boardMovementQueryKey } from '@/services/board-movement';
import { useAttendanceAction } from './use-attendance-action';

/** O timer dispara depois do fim da janela, e não no mesmo milissegundo: um disparo adiantado deixaria o estado preso. */
const EXPIRY_SLACK_MS = 50;

export interface WaiterCallControl {
  state: 'unavailable' | 'idle' | 'pending' | 'called';
  /** ISO do servidor, só em `called`. */
  calledAt: string | null;
  call: () => void;
}

/**
 * O estado da chamada vem de `movement.waiter_call`, do cache da movimentação: todo botão de garçom da tela lê dele, e
 * o 201 o adianta. "Chamado" vale até `created_at + window_seconds` pelo relógio do aparelho, e ao fim a movimentação é
 * relida para confirmar com a hora do servidor.
 */
export function useWaiterCall(): WaiterCallControl {
  const session = useBoardSession();
  const isOffline = useIsOffline();
  const queryClient = useQueryClient();
  const [, rerender] = useReducer((tick: number) => tick + 1, 0);
  const movementId = session.status === 'ready' ? session.sessionId : null;
  const waiterCall = session.status === 'ready' ? session.movement.waiter_call : null;
  const isCalled = isWaiterCallActive(waiterCall, Date.now());
  const endsAt = resolveWaiterCallEnd(waiterCall);

  const { run, isPending } = useAttendanceAction({
    movementId,
    mutationKey: waiterCallMutationKey(movementId ?? ''),
    request: requestWaiterCall,
    apply: (movement, response) => ({
      ...movement,
      waiter_call: { id: response.id, created_at: response.created_at, window_seconds: response.window_seconds },
    }),
    failureMessage: attendanceCopy.waiterFailed,
    isBlocked: isCalled || isOffline,
  });

  useEffect(() => {
    if (movementId === null || endsAt === null) {
      return undefined;
    }

    const remaining = endsAt - Date.now();

    // fim já passado (relógio do aparelho adiantado): nada a agendar, e o toque seguinte recebe o 200 da mesma chamada
    if (remaining <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      rerender();
      void queryClient.invalidateQueries({ queryKey: boardMovementQueryKey(movementId) }, { cancelRefetch: false });
    }, remaining + EXPIRY_SLACK_MS);

    return () => clearTimeout(timer);
  }, [movementId, endsAt, queryClient]);

  if (movementId === null) {
    return { state: 'unavailable', calledAt: null, call: run };
  }

  if (isCalled && waiterCall !== null) {
    return { state: 'called', calledAt: waiterCall.created_at, call: run };
  }

  if (isPending) {
    return { state: 'pending', calledAt: null, call: run };
  }

  return { state: isOffline ? 'unavailable' : 'idle', calledAt: null, call: run };
}
