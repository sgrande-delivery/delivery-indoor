'use client';

import { useCallback, useEffect, useRef } from 'react';
import { MutationKey, useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceCopy } from '@/components/board/actions/attendance-copy';
import { resolveAttendanceFailure } from '@/components/board/actions/attendance-failure';
import { useToast } from '@/components/ui';
import { boardMovementQueryKey } from '@/services/board-movement';
import type { BoardMovementDetail } from '@/types/board-movement';

interface AttendanceActionOptions<Response> {
  movementId: string | null;
  mutationKey: MutationKey;
  request: (movementId: string) => Promise<Response>;
  /** O que o servidor disse, aplicado à movimentação em cache: o aparelho que agiu não espera a releitura. */
  apply: (movement: BoardMovementDetail, response: Response) => BoardMovementDetail;
  failureMessage: string;
  /** Recusa o toque (offline, estado já feito, fora da mesa). A trava de "em voo" é daqui. */
  isBlocked: boolean;
}

export interface AttendanceAction {
  run: () => void;
  /** Em voo em qualquer instância do hook: o tablet em pé tem dois botões de garçom na tela. */
  isPending: boolean;
}

/**
 * O ciclo comum das duas ações da mesa. `retry: 0`: uma mutação que repete sozinha chamaria o garçom de novo depois
 * de o cliente já ter sido atendido. A falha não perde o estado e nunca vai só para o console: vira toast, e só a
 * falha que o próximo toque pode resolver (rede, 5xx) oferece "Tentar de novo".
 */
export function useAttendanceAction<Response>(options: AttendanceActionOptions<Response>): AttendanceAction {
  const { movementId, mutationKey, request, apply, failureMessage, isBlocked } = options;
  const queryClient = useQueryClient();
  const toast = useToast();
  const inFlight = useRef(false);
  const runRef = useRef<() => void>(() => undefined);
  const pendingCount = useIsMutating({ mutationKey });

  const { mutate } = useMutation({
    mutationKey,
    retry: 0,
    mutationFn: (id: string) => request(id),
    onSuccess: (response, id) => {
      queryClient.setQueryData<BoardMovementDetail>(boardMovementQueryKey(id), current =>
        current === undefined ? current : apply(current, response)
      );
    },
    onError: (error, id) => {
      const failure = resolveAttendanceFailure(error);

      if (failure === 'throttled') {
        toast.show({ message: attendanceCopy.throttled, variant: 'warning' });
        return;
      }

      if (failure === 'refused') {
        // a mesa pode ter sido liberada ou fechada: o portão da sessão decide, com a movimentação relida
        void queryClient.invalidateQueries({ queryKey: boardMovementQueryKey(id) });
        toast.show({ message: failureMessage, variant: 'error' });
        return;
      }

      toast.show({
        message: failureMessage,
        variant: 'error',
        action: { label: attendanceCopy.retry, onClick: () => runRef.current() },
      });
    },
    onSettled: () => {
      inFlight.current = false;
    },
  });

  const run = useCallback((): void => {
    if (movementId === null || isBlocked || inFlight.current) {
      return;
    }

    inFlight.current = true;
    mutate(movementId);
  }, [movementId, isBlocked, mutate]);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  return { run, isPending: pendingCount > 0 };
}
