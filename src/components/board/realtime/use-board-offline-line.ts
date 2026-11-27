'use client';

import { UseQueryResult } from '@tanstack/react-query';
import { formatClockTime } from '@/helpers/clock-time';
import { useIsOffline, useOfflineBannerMessage } from '@/providers/connectivity/ConnectivityProvider';
import { BoardProducts } from '@/types/board-bill';

function boardOfflineLine(clock: string): string {
  return `Esta é a conta de ${clock}. Novos lançamentos do garçom aparecem quando a internet voltar.`;
}

/** Com a conta montada e offline, o banner diz de quando é o que está na tela (a última leitura dos itens). */
export function useBoardOfflineLine(products: UseQueryResult<BoardProducts>): void {
  const isOffline = useIsOffline();
  const hasData = products.data !== undefined;

  useOfflineBannerMessage(isOffline && hasData ? boardOfflineLine(formatClockTime(products.dataUpdatedAt)) : null);
}
