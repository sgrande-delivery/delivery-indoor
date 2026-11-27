'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ALL_BOARD_BILL_KEYS, resolveBoardBillQueryKeys } from '@/components/board/realtime/board-bill-keys';

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
      await Promise.all(
        resolveBoardBillQueryKeys(movementId, ALL_BOARD_BILL_KEYS).map(queryKey =>
          queryClient.invalidateQueries({ queryKey })
        )
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [movementId, queryClient]);

  return { refresh, isRefreshing };
}
