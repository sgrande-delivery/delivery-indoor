'use client';

import { useMemo } from 'react';
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';
import { flattenUniqueProducts } from '@/components/category/use-category-products';
import { SearchFilters } from '@/helpers/search-params';
import { fetchSearchResultsPage, searchResultsQueryKey } from '@/services/search';
import { ProductSummary } from '@/types/product';
import { SearchFacetCategory } from '@/types/product-page';
import { RelaxCandidate, SearchResultsPage } from '@/types/search';

const SEARCH_STALE_TIME = 5 * 60 * 1000;

export interface UseSearchResults {
  query: UseInfiniteQueryResult<InfiniteData<SearchResultsPage>, Error>;
  /** Achatado, sem duplicata por `public_id` e sem produto desativado. */
  products: ProductSummary[];
  /** `meta.total` da primeira página: o número é do conjunto inteiro, não da lista rolada. */
  total: number | null;
  relaxed: RelaxCandidate[];
  categoryFacets: SearchFacetCategory[];
  /** A última página carregada: `página X de Y`. */
  lastLoadedPage: { current: number; last: number } | null;
  /**
   * Com "sem" aplicado, a falha da primeira leitura esconde a lista: o React Query manteria o resultado anterior, que
   * pode conter justamente o ingrediente excluído, e numa mesa isso pode ser alergia. Falha da página seguinte não
   * entra: a primeira página já foi confirmada com o filtro.
   */
  hidesStaleResults: boolean;
}

export function useSearchResults(filters: SearchFilters): UseSearchResults {
  const query = useInfiniteQuery({
    queryKey: searchResultsQueryKey(filters),
    queryFn: ({ pageParam }) => fetchSearchResultsPage(filters, pageParam),
    initialPageParam: 1,
    // O cursor é do servidor: nenhuma conta sobre `total`/`per_page`.
    getNextPageParam: lastPage => (lastPage.meta.has_more ? lastPage.meta.current_page + 1 : undefined),
    staleTime: SEARCH_STALE_TIME,
  });

  const hidesStaleResults = query.isError && !query.isFetchNextPageError && filters.excludeIngredients.length > 0;
  const pages = hidesStaleResults ? undefined : query.data?.pages;
  const products = useMemo(() => flattenUniqueProducts(pages ?? []), [pages]);
  const first = pages?.[0];
  const last = pages?.[pages.length - 1];

  return {
    query,
    products,
    total: first?.meta.total ?? null,
    relaxed: first?.relaxed ?? [],
    categoryFacets: first?.categoryFacets ?? [],
    hidesStaleResults,
    lastLoadedPage: last ? { current: last.meta.current_page, last: last.meta.last_page } : null,
  };
}
