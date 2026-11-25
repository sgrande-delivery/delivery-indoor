import { skipToken, useQuery, UseQueryResult } from '@tanstack/react-query';
import { boardProductsQueryKey, fetchBoardProducts } from '@/services/board-bill';
import { isBoardMovementId, isBoardMovementNotFound } from '@/services/board-movement';
import { BoardProducts } from '@/types/board-bill';

/** Acompanha o `retry` padrão do `QueryClient` em `src/App.tsx`. */
const MAX_RETRIES = 2;

export function useBoardProducts(id: string | null): UseQueryResult<BoardProducts> {
  return useQuery({
    queryKey: boardProductsQueryKey(id ?? ''),
    queryFn: isBoardMovementId(id) ? () => fetchBoardProducts(id) : skipToken,
    retry: (failureCount, error) => !isBoardMovementNotFound(error) && failureCount < MAX_RETRIES,
  });
}
