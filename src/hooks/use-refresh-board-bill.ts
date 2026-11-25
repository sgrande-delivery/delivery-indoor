'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { boardPaymentsQueryKey, boardProductsQueryKey } from '@/services/board-bill';
import { boardMovementQueryKey } from '@/services/board-movement';

export interface RefreshBoardBill {
  refresh: () => Promise<void>;
  /** Estado do próprio hook: o botão não gira quando quem relê é o socket. */
  isRefreshing: boolean;
}

export function useRefreshBoardBill(movementId: string | null): RefreshBoardBill {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    if (!movementId) {
      return;
    }

    setIsRefreshing(true);

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: boardMovementQueryKey(movementId) }),
        queryClient.invalidateQueries({ queryKey: boardProductsQueryKey(movementId) }),
        queryClient.invalidateQueries({ queryKey: boardPaymentsQueryKey(movementId) }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [movementId, queryClient]);

  return { refresh, isRefreshing };
}
