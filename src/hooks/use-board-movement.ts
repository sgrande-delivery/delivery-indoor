import { skipToken, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  boardMovementQueryKey,
  fetchBoardMovement,
  isBoardMovementId,
  isBoardMovementNotFound,
} from '@/services/board-movement';
import { BoardMovementDetail } from '@/types/board-movement';

/** Acompanha o `retry` padrão do `QueryClient` em `src/App.tsx`. */
const MAX_RETRIES = 2;

export function useBoardMovement(id: string | null): UseQueryResult<BoardMovementDetail> {
  return useQuery({
    queryKey: boardMovementQueryKey(id ?? ''),
    queryFn: isBoardMovementId(id) ? () => fetchBoardMovement(id) : skipToken,
    retry: (failureCount, error) => !isBoardMovementNotFound(error) && failureCount < MAX_RETRIES,
  });
}
