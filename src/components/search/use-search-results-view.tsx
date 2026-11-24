'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { styled } from '@mui/material/styles';
import CategoryListSkeleton from '@/components/category/CategoryListSkeleton';
import CategoryProductList from '@/components/category/CategoryProductList';
import InlineError from '@/components/error/InlineError';
import RouteErrorState from '@/components/error/RouteErrorState';
import { MENU_ERROR_DESCRIPTION, MENU_REFRESH_ERROR } from '@/components/menu/menu-copy';
import PhoneOnly from '@/components/menu/PhoneOnly';
import ProductGridCard from '@/components/menu/ProductGridCard';
import ProductGridSkeleton from '@/components/menu/ProductGridSkeleton';
import { tabletGutter } from '@/components/menu/tablet-gutter';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { EmptyState } from '@/components/ui';
import { resolveScrollBehavior } from '@/helpers/scroll-behavior';
import { buildSearchHref, SearchFilters } from '@/helpers/search-params';
import { useLoadMore } from '@/hooks/use-load-more';
import { useQueryScreenState } from '@/hooks/use-query-screen-state';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { spacingScale } from '@/theme';
import { ProductSummary } from '@/types/product';
import { useIngredients } from './ingredients/use-ingredients';
import { createRelaxSuggestion } from './relax-suggestion';
import RelaxSuggestionBand from './RelaxSuggestionBand';
import { searchLayoutMetrics } from './search-metrics';
import SearchControlsRail from './SearchControlsRail';
import SearchProductItem from './SearchProductItem';
import SearchResultsCount from './SearchResultsCount';
import { SearchNavigation } from './use-search-navigation';
import { useSearchResults } from './use-search-results';

const ERROR_TITLE = 'Não conseguimos fazer a busca';
const EMPTY_TITLE = 'Nada encontrado';
const END_LABEL = 'Você viu todos os resultados';
const EMPTY_DESCRIPTION = 'Tente outro termo ou tire um dos filtros.';

// O fim da lista de linhas do celular; o tablet leva o respiro na própria grade.
const Body = styled('div')({
  paddingBlockEnd: spacingScale.lg,
  [`@media ${tabletShellMediaQuery}`]: {
    paddingBlockEnd: 0,
  },
});

const NoticeSlot = styled('div')({
  paddingInline: searchLayoutMetrics.railPaddingInline,
  paddingBlockEnd: searchLayoutMetrics.railPaddingBlockEnd,
  ...tabletGutter('paddingInline'),
});

export interface SearchResultsView {
  /** A trilha de controles e a faixa de relaxamento: ficam no cabeçalho, depois do campo. */
  controls: React.ReactNode;
  band: React.ReactNode;
  body: React.ReactNode;
}

export interface UseSearchResultsViewParams {
  filters: SearchFilters;
  enabled: boolean;
  navigation: SearchNavigation;
  scrollerRef: React.RefObject<HTMLElement | null>;
  isTablet: boolean;
}

/**
 * O resultado dividido em cabeçalho e corpo: o campo da busca fica fora daqui, num lugar que não troca, e é isso que
 * mantém o mesmo `input` (e o teclado aberto) entre a entrada e a lista.
 */
export function useSearchResultsView({
  filters,
  enabled,
  navigation,
  scrollerRef,
  isTablet,
}: UseSearchResultsViewParams): SearchResultsView {
  const {
    query,
    products,
    total,
    relaxed,
    categoryFacets,
    lastLoadedPage,
    hidesStaleResults,
    isPlaceholderData,
    displayedTerm,
  } = useSearchResults(filters, enabled);
  const catalog = useIngredients('').data;
  const screen = useQueryScreenState(query);
  const isOffline = useIsOffline();
  const href = buildSearchHref(filters);
  const lastHref = useRef(href);

  const { fetchNextPage } = query;
  const loadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const sentinelRef = useLoadMore(
    enabled &&
      !isPlaceholderData &&
      query.hasNextPage &&
      !query.isFetchingNextPage &&
      !query.isFetchNextPageError &&
      !isOffline,
    loadMore,
    scrollerRef
  );

  // Trocar o recorte não remonta a tela, e quem rola (a região no tablet, o shell no celular) continua onde estava.
  useEffect(() => {
    if (lastHref.current === href) {
      return;
    }

    lastHref.current = href;
    scrollerRef.current?.scrollTo({ top: 0, behavior: resolveScrollBehavior() });
  }, [href, scrollerRef]);

  const includedNames = useMemo(
    () => (catalog ?? []).filter(({ id }) => filters.includeIngredients.includes(id)).map(({ name }) => name),
    [catalog, filters.includeIngredients]
  );

  const renderItem = useCallback(
    (product: ProductSummary) => (
      <SearchProductItem product={product} term={displayedTerm} includedIngredients={includedNames} />
    ),
    [displayedTerm, includedNames]
  );

  const renderGridItem = useCallback(
    (product: ProductSummary) => <ProductGridCard product={product} term={displayedTerm} />,
    [displayedTerm]
  );

  const controls = <SearchControlsRail filters={filters} facets={categoryFacets} onChange={navigation.go} />;
  const isRetryingHidden = hidesStaleResults && query.isFetching;

  if (screen.view === 'error' || (hidesStaleResults && !isRetryingHidden)) {
    return {
      controls: null,
      band: null,
      body: (
        <RouteErrorState
          error={screen.error}
          failureStreak={screen.failureStreak}
          onRetry={screen.retry}
          title={ERROR_TITLE}
          description={MENU_ERROR_DESCRIPTION}
        />
      ),
    };
  }

  if (screen.view === 'skeleton' || isRetryingHidden) {
    return {
      controls,
      band: null,
      body: (
        <>
          <PhoneOnly>
            <CategoryListSkeleton />
          </PhoneOnly>
          <ProductGridSkeleton />
        </>
      ),
    };
  }

  const suggestion = createRelaxSuggestion(relaxed, filters);
  const band = suggestion && (
    <RelaxSuggestionBand suggestion={suggestion} onRelax={next => navigation.goTo(next.href)} />
  );

  if (products.length === 0 && !query.hasNextPage) {
    return {
      controls,
      band: null,
      body: (
        <>
          <EmptyState icon="search_off" title={EMPTY_TITLE} description={EMPTY_DESCRIPTION} />
          {band}
        </>
      ),
    };
  }

  return {
    controls,
    band,
    body: (
      <Body>
        {query.isRefetchError && (
          <NoticeSlot>
            <InlineError message={MENU_REFRESH_ERROR} onRetry={screen.retry} isRetrying={query.isFetching} />
          </NoticeSlot>
        )}
        <SearchResultsCount
          total={total ?? products.length}
          term={filters.term}
          page={lastLoadedPage}
          isUpdating={isPlaceholderData}
        />
        <CategoryProductList
          products={products}
          renderItem={renderItem}
          variant={isTablet ? 'grid' : 'list'}
          renderGridItem={renderGridItem}
          endLabel={END_LABEL}
          isFetchingNextPage={query.isFetchingNextPage}
          hasNextPage={query.hasNextPage}
          nextPageError={query.isFetchNextPageError}
          onRetryNextPage={loadMore}
          sentinelRef={sentinelRef}
        />
      </Body>
    ),
  };
}
