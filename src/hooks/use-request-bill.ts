'use client';

import { attendanceCopy } from '@/components/board/actions/attendance-copy';
import { useBoardSession } from '@/providers/board-session';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { billRequestMutationKey, requestBill } from '@/services/board-attendance';
import { useAttendanceAction } from './use-attendance-action';

export interface RequestBillControl {
  state: 'unavailable' | 'idle' | 'pending' | 'requested';
  /** ISO do servidor, só em `requested`. */
  requestedAt: string | null;
  request: () => void;
}

/** O estado vem de `movement.bill_requested_at`, e o PDV também o preenche: o botão não distingue quem pediu. */
export function useRequestBill(): RequestBillControl {
  const session = useBoardSession();
  const isOffline = useIsOffline();
  const isReady = session.status === 'ready';
  const movementId = isReady ? session.sessionId : null;
  const requestedAt = isReady ? session.movement.bill_requested_at : null;
  const isPaid = isReady && session.movement.is_board_paid;

  const { run, isPending } = useAttendanceAction({
    movementId,
    mutationKey: billRequestMutationKey(movementId ?? ''),
    request: requestBill,
    apply: (movement, response) => ({ ...movement, bill_requested_at: response.bill_requested_at }),
    failureMessage: attendanceCopy.billFailed,
    isBlocked: isOffline || isPaid || requestedAt !== null,
  });

  if (movementId === null || isPaid) {
    return { state: 'unavailable', requestedAt: null, request: run };
  }

  if (requestedAt !== null) {
    return { state: 'requested', requestedAt, request: run };
  }

  if (isPending) {
    return { state: 'pending', requestedAt: null, request: run };
  }

  return { state: isOffline ? 'unavailable' : 'idle', requestedAt: null, request: run };
}
