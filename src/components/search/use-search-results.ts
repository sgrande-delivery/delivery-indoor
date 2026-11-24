'use client';

import { useMemo, useState } from 'react';
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';
import { flattenUniqueProducts } from '@/components/category/use-category-products';
import { differsOnlyByTerm, SearchFilters } from '@/helpers/search-params';
import { fetchSearchResultsPage, searchResultsKeyFilters, searchResultsQueryKey } from '@/services/search';
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
  /** As da página carregada ou, enquanto o recorte novo carrega, as últimas conhecidas (ver `useRetainedFacets`). */
  categoryFacets: SearchFacetCategory[];
  /** A última página carregada: `página X de Y`. */
  lastLoadedPage: { current: number; last: number } | null;
  /**
   * Com "sem" aplicado, a falha da primeira leitura esconde a lista: o React Query manteria o resultado anterior, que
   * pode conter justamente o ingrediente excluído, e numa mesa isso pode ser alergia. Falha da página seguinte não
   * entra: a primeira página já foi confirmada com o filtro.
   */
  hidesStaleResults: boolean;
  /** A lista na tela é a do termo anterior: só o termo mudou, e a resposta nova ainda não chegou. */
  isPlaceholderData: boolean;
  /** O termo de quem gerou a lista na tela: durante a atualização, o anterior — é ele que o destaque marca. */
  displayedTerm: string | null;
}

/**
 * As categorias ficam na trilha durante o carregamento do recorte novo. Sem isso a trilha encolhe por um instante, o
 * navegador puxa o scroll horizontal para o novo limite, e a chip tocada no fim dela sai da tela. Trocar de categoria
 * devolve as mesmas chips, porque a faceta ignora o próprio filtro.
 */
function useRetainedFacets(current: SearchFacetCategory[] | undefined): SearchFacetCategory[] {
  const [known, setKnown] = useState<SearchFacetCategory[]>([]);

  if (current !== undefined && current !== known) {
    setKnown(current);
  }

  return current ?? known;
}

/**
 * Enquanto o termo novo carrega, a lista na tela é a do termo anterior. Marcar nela o termo novo deixaria sem destaque
 * os itens que só casavam com o anterior, como se não batessem com a busca.
 */
function useDisplayedTerm(term: string | null, isPlaceholderData: boolean, hasData: boolean): string | null {
  const [settled, setSettled] = useState(term);

  if (!isPlaceholderData && hasData && settled !== term) {
    setSettled(term);
  }

  return isPlaceholderData ? settled : term;
}

export function useSearchResults(filters: SearchFilters, enabled: boolean): UseSearchResults {
  const query = useInfiniteQuery({
    queryKey: searchResultsQueryKey(filters),
    queryFn: ({ pageParam }) => fetchSearchResultsPage(filters, pageParam),
    initialPageParam: 1,
    // O cursor é do servidor: nenhuma conta sobre `total`/`per_page`.
    getNextPageParam: lastPage => (lastPage.meta.has_more ? lastPage.meta.current_page + 1 : undefined),
    staleTime: SEARCH_STALE_TIME,
    enabled,
    // A lista anterior só segura a tela quando o que mudou é o termo, ela tinha resultado e não falhou: vazio e erro
    // anteriores viram skeleton, e filtro novo também.
    placeholderData: (previousData, previousQuery) => {
      const previous = searchResultsKeyFilters(previousQuery?.queryKey);
      const isUsable =
        previous !== null &&
        differsOnlyByTerm(previous, filters) &&
        previousQuery?.state.status !== 'error' &&
        previousData?.pages[0]?.data.length !== 0;

      return isUsable ? previousData : undefined;
    },
  });

  const hidesStaleResults = query.isError && !query.isFetchNextPageError && filters.excludeIngredients.length > 0;
  const pages = hidesStaleResults ? undefined : query.data?.pages;
  const products = useMemo(() => flattenUniqueProducts(pages ?? []), [pages]);
  const first = pages?.[0];
  const last = pages?.[pages.length - 1];
  const categoryFacets = useRetainedFacets(first?.categoryFacets);
  const displayedTerm = useDisplayedTerm(filters.term, query.isPlaceholderData, first !== undefined);

  return {
    query,
    products,
    total: first?.meta.total ?? null,
    relaxed: first?.relaxed ?? [],
    categoryFacets,
    hidesStaleResults,
    isPlaceholderData: query.isPlaceholderData,
    displayedTerm,
    lastLoadedPage: last ? { current: last.meta.current_page, last: last.meta.last_page } : null,
  };
}
