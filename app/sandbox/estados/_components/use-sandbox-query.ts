'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/services/api';

export const SANDBOX_QUERY_KEY = ['sandbox', 'states'] as const;

const RETRY_DELAY_MS = 300;

export interface SandboxRestaurant {
  name: string;
  is_open: boolean;
}

async function fetchRestaurant(): Promise<SandboxRestaurant> {
  const { data } = await api.get<SandboxRestaurant>('restaurants');

  return data;
}

export function useSandboxQuery(): { query: UseQueryResult<SandboxRestaurant, unknown>; reload: () => void } {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: SANDBOX_QUERY_KEY, queryFn: fetchRestaurant, retryDelay: RETRY_DELAY_MS });

  // `resetQueries` leva a query de volta a `pending`, sem dado: é o caminho que exercita o skeleton.
  const reload = useCallback(() => {
    void queryClient.resetQueries({ queryKey: SANDBOX_QUERY_KEY });
  }, [queryClient]);

  return { query, reload };
}
