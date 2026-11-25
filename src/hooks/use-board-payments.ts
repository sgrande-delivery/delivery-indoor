import { skipToken, useQuery, UseQueryResult } from '@tanstack/react-query';
import { boardPaymentsQueryKey, fetchBoardPayments } from '@/services/board-bill';
import { isBoardMovementId, isBoardMovementNotFound } from '@/services/board-movement';
import { BoardPayment } from '@/types/board-bill';

/** Acompanha o `retry` padrão do `QueryClient` em `src/App.tsx`. */
const MAX_RETRIES = 2;

export function useBoardPayments(id: string | null): UseQueryResult<BoardPayment[]> {
  return useQuery({
    queryKey: boardPaymentsQueryKey(id ?? ''),
    queryFn: isBoardMovementId(id) ? () => fetchBoardPayments(id) : skipToken,
    retry: (failureCount, error) => !isBoardMovementNotFound(error) && failureCount < MAX_RETRIES,
  });
}
