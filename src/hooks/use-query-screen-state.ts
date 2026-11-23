'use client';

import { useCallback, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';

export type ScreenView = 'skeleton' | 'error' | 'content';

export interface QueryScreenState {
  view: ScreenView;
  error: unknown;
  failureStreak: number;
  isRefreshFailed: boolean;
  retry: () => void;
}

interface StreakBaseline {
  dataUpdatedAt: number;
  errorUpdateCount: number;
}

/**
 * Traduz o resultado da query na forma da tela. A **ordem** dos testes é o ponto (React Query v5): depois de um
 * erro, o `refetch()` deixa `status: 'error'` com `fetchStatus: 'fetching'` até a resposta, e testar `isError`
 * antes de `isFetching` mostraria o erro com o retry correndo por baixo — o spinner sobre o erro que a RN-07 proíbe.
 *
 * 1. tem dado: conteúdo;
 * 2. offline sem dado, ou `isPending`/`isFetching`: skeleton;
 * 3. `isError`: erro.
 *
 * Uma query desabilitada (`pending` sem `fetching`) cai em skeleton: quem decide "sem mesa" é o portão da sessão,
 * acima da tela.
 */
export function useQueryScreenState<TData>(query: UseQueryResult<TData, unknown>): QueryScreenState {
  const isOffline = useIsOffline();
  const { data, error, isError, isPending, isFetching, dataUpdatedAt, errorUpdateCount, refetch } = query;

  // A conta é de falhas finais vistas desde o último sucesso (ou desde a montagem). O `errorUpdateCount` só soma, então o
  // ponto de partida é guardado quando o `dataUpdatedAt` muda, durante o render, sem contar em efeito.
  const [baseline, setBaseline] = useState<StreakBaseline>({ dataUpdatedAt, errorUpdateCount });

  if (baseline.dataUpdatedAt !== dataUpdatedAt) {
    setBaseline({ dataUpdatedAt, errorUpdateCount });
  }

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const streak = Math.max(errorUpdateCount - baseline.errorUpdateCount, 0);

  if (data !== undefined) {
    return { view: 'content', error, failureStreak: streak, isRefreshFailed: isError && !isOffline, retry };
  }

  if (isOffline || isPending || isFetching) {
    return { view: 'skeleton', error, failureStreak: streak, isRefreshFailed: false, retry };
  }

  if (isError) {
    return { view: 'error', error, failureStreak: Math.max(streak, 1), isRefreshFailed: false, retry };
  }

  return { view: 'skeleton', error, failureStreak: streak, isRefreshFailed: false, retry };
}
