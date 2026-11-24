'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { styled } from '@mui/material/styles';
import CategoryListSkeleton from '@/components/category/CategoryListSkeleton';
import CategoryProductList from '@/components/category/CategoryProductList';
import InlineError from '@/components/error/InlineError';
import RouteErrorState from '@/components/error/RouteErrorState';
import { MENU_ERROR_DESCRIPTION, MENU_REFRESH_ERROR } from '@/components/menu/menu-copy';
import { useAppScroller } from '@/components/shell/AppShell';
import { EmptyState } from '@/components/ui';
import { buildSearchHref, SearchFilters } from '@/helpers/search-params';
import { resolveScrollBehavior } from '@/helpers/scroll-behavior';
import { useLoadMore } from '@/hooks/use-load-more';
import { useQueryScreenState } from '@/hooks/use-query-screen-state';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { spacingScale } from '@/theme';
import { ProductSummary } from '@/types/product';
import CategoryFacetRail from './CategoryFacetRail';
import { useIngredients } from './ingredients/use-ingredients';
import { createRelaxSuggestion } from './relax-suggestion';
import RelaxSuggestionBand from './RelaxSuggestionBand';
import { searchLayoutMetrics } from './search-metrics';
import SearchControlsRail from './SearchControlsRail';
import SearchHeader from './SearchHeader';
import SearchProductItem from './SearchProductItem';
import SearchResultsCount from './SearchResultsCount';
import SearchTermField from './SearchTermField';
import { useSearchNavigation } from './use-search-navigation';
import { useSearchResults } from './use-search-results';

const ERROR_TITLE = 'Não conseguimos fazer a busca';
const EMPTY_TITLE = 'Nada encontrado';
const END_LABEL = 'Você viu todos os resultados';
const EMPTY_DESCRIPTION = 'Tente outro termo ou tire um dos filtros.';

export interface SearchResultsScreenProps {
  filters: SearchFilters;
}

const Root = styled('div')({
  paddingBlockEnd: spacingScale.lg,
});

const NoticeSlot = styled('div')({
  paddingInline: searchLayoutMetrics.railPaddingInline,
  paddingBlockEnd: searchLayoutMetrics.railPaddingBlockEnd,
});

const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({ filters }) => {
  const { query, products, total, relaxed, categoryFacets, lastLoadedPage, hidesStaleResults } =
    useSearchResults(filters);
  const catalog = useIngredients('').data;
  const screen = useQueryScreenState(query);
  const navigation = useSearchNavigation(filters);
  const isOffline = useIsOffline();
  const scrollerRef = useAppScroller();
  const href = buildSearchHref(filters);
  const lastHref = useRef(href);

  const { fetchNextPage } = query;
  const loadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const sentinelRef = useLoadMore(
    query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError && !isOffline,
    loadMore
  );

  // Trocar o recorte não remonta a tela, e o scroller do shell continua onde estava.
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
      <SearchProductItem product={product} term={filters.term} includedIngredients={includedNames} />
    ),
    [filters.term, includedNames]
  );

  const header = (
    <SearchHeader>
      <SearchTermField
        key={filters.term ?? ''}
        initialTerm={filters.term ?? ''}
        onSubmit={navigation.submit}
        onClear={navigation.clear}
      />
    </SearchHeader>
  );

  const controls = <SearchControlsRail filters={filters} onChange={navigation.go} />;

  const isRetryingHidden = hidesStaleResults && query.isFetching;

  if (screen.view === 'error' || (hidesStaleResults && !isRetryingHidden)) {
    return (
      <Root>
        {header}
        <RouteErrorState
          error={screen.error}
          failureStreak={screen.failureStreak}
          onRetry={screen.retry}
          title={ERROR_TITLE}
          description={MENU_ERROR_DESCRIPTION}
        />
      </Root>
    );
  }

  if (screen.view === 'skeleton' || isRetryingHidden) {
    return (
      <Root>
        {header}
        {controls}
        <CategoryListSkeleton />
      </Root>
    );
  }

  const suggestion = createRelaxSuggestion(relaxed, filters);
  const band = suggestion && (
    <RelaxSuggestionBand suggestion={suggestion} onRelax={next => navigation.goTo(next.href)} />
  );
  const facets = (
    <CategoryFacetRail
      facets={categoryFacets}
      categoryId={filters.categoryId}
      onSelect={categoryId => navigation.go({ ...filters, categoryId })}
    />
  );

  if (products.length === 0 && !query.hasNextPage) {
    return (
      <Root>
        {header}
        {controls}
        {facets}
        <EmptyState icon="search_off" title={EMPTY_TITLE} description={EMPTY_DESCRIPTION} />
        {band}
      </Root>
    );
  }

  return (
    <Root>
      {header}
      {controls}
      {facets}
      {band}
      {query.isRefetchError && (
        <NoticeSlot>
          <InlineError message={MENU_REFRESH_ERROR} onRetry={screen.retry} isRetrying={query.isFetching} />
        </NoticeSlot>
      )}
      <SearchResultsCount total={total ?? products.length} term={filters.term} page={lastLoadedPage} />
      <CategoryProductList
        products={products}
        renderItem={renderItem}
        endLabel={END_LABEL}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        nextPageError={query.isFetchNextPageError}
        onRetryNextPage={loadMore}
        sentinelRef={sentinelRef}
      />
    </Root>
  );
};

export default SearchResultsScreen;
