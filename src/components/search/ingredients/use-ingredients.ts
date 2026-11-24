'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchFilters } from '@/helpers/search-params';
import { fetchIngredients, ingredientsQueryKey } from '@/services/ingredients';
import { fetchSearchPendingTotal, searchPendingQueryKey } from '@/services/search';

// O cache do servidor é de 5 min: reler antes disso devolve o mesmo corpo.
const INGREDIENTS_STALE_TIME = 5 * 60 * 1000;

export function useIngredients(term: string) {
  return useQuery({
    queryKey: ingredientsQueryKey(term),
    queryFn: () => fetchIngredients(term),
    staleTime: INGREDIENTS_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

// A contagem é dica do CTA: um minuto basta, e a chave já muda a cada seleção.
const PENDING_STALE_TIME = 60 * 1000;

/** `meta.total` da seleção pendente. Sem `enabled` não há dado: o número anterior não pode valer para outra seleção. */
export function useSearchPendingTotal(pending: SearchFilters, enabled: boolean): UseSearchPendingTotal {
  const query = useQuery({
    queryKey: searchPendingQueryKey(pending),
    queryFn: () => fetchSearchPendingTotal(pending),
    enabled,
    staleTime: PENDING_STALE_TIME,
    placeholderData: keepPreviousData,
  });

  return { total: enabled && !query.isError ? (query.data ?? null) : null, isCounting: query.isFetching };
}

export interface UseSearchPendingTotal {
  total: number | null;
  isCounting: boolean;
}
