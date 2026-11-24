'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { styled } from '@mui/material/styles';
import CategoryListSkeleton from '@/components/category/CategoryListSkeleton';
import CategoryProductList from '@/components/category/CategoryProductList';
import InlineError from '@/components/error/InlineError';
import RouteErrorState from '@/components/error/RouteErrorState';
import { MENU_ERROR_DESCRIPTION, MENU_REFRESH_ERROR } from '@/components/menu/menu-copy';
import MenuScreenLayout from '@/components/menu/MenuScreenLayout';
import PhoneOnly from '@/components/menu/PhoneOnly';
import ProductGridCard from '@/components/menu/ProductGridCard';
import ProductGridSkeleton from '@/components/menu/ProductGridSkeleton';
import { useMenuScreenScroller } from '@/components/menu/menu-scroller';
import { tabletGutter } from '@/components/menu/tablet-gutter';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { EmptyState } from '@/components/ui';
import { buildSearchHref, SearchFilters } from '@/helpers/search-params';
import { resolveScrollBehavior } from '@/helpers/scroll-behavior';
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

const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({ filters }) => {
  const { query, products, total, relaxed, categoryFacets, lastLoadedPage, hidesStaleResults } =
    useSearchResults(filters);
  const catalog = useIngredients('').data;
  const screen = useQueryScreenState(query);
  const navigation = useSearchNavigation(filters);
  const isOffline = useIsOffline();
  const { regionRef, scrollerRef, isTablet } = useMenuScreenScroller();
  const href = buildSearchHref(filters);
  const lastHref = useRef(href);

  const { fetchNextPage } = query;
  const loadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const sentinelRef = useLoadMore(
    query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError && !isOffline,
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
      <SearchProductItem product={product} term={filters.term} includedIngredients={includedNames} />
    ),
    [filters.term, includedNames]
  );

  const renderGridItem = useCallback(
    (product: ProductSummary) => <ProductGridCard product={product} term={filters.term} />,
    [filters.term]
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

  const controls = <SearchControlsRail filters={filters} facets={categoryFacets} onChange={navigation.go} />;

  const isRetryingHidden = hidesStaleResults && query.isFetching;

  if (screen.view === 'error' || (hidesStaleResults && !isRetryingHidden)) {
    return (
      <MenuScreenLayout header={header} regionRef={regionRef}>
        <RouteErrorState
          error={screen.error}
          failureStreak={screen.failureStreak}
          onRetry={screen.retry}
          title={ERROR_TITLE}
          description={MENU_ERROR_DESCRIPTION}
        />
      </MenuScreenLayout>
    );
  }

  if (screen.view === 'skeleton' || isRetryingHidden) {
    return (
      <MenuScreenLayout
        header={
          <>
            {header}
            {controls}
          </>
        }
        regionRef={regionRef}
      >
        <PhoneOnly>
          <CategoryListSkeleton />
        </PhoneOnly>
        <ProductGridSkeleton />
      </MenuScreenLayout>
    );
  }

  const suggestion = createRelaxSuggestion(relaxed, filters);
  const band = suggestion && (
    <RelaxSuggestionBand suggestion={suggestion} onRelax={next => navigation.goTo(next.href)} />
  );

  if (products.length === 0 && !query.hasNextPage) {
    return (
      <MenuScreenLayout
        header={
          <>
            {header}
            {controls}
          </>
        }
        regionRef={regionRef}
      >
        <EmptyState icon="search_off" title={EMPTY_TITLE} description={EMPTY_DESCRIPTION} />
        {band}
      </MenuScreenLayout>
    );
  }

  return (
    <MenuScreenLayout
      header={
        <>
          {header}
          {controls}
          {band}
        </>
      }
      regionRef={regionRef}
    >
      <Body>
        {query.isRefetchError && (
          <NoticeSlot>
            <InlineError message={MENU_REFRESH_ERROR} onRetry={screen.retry} isRetrying={query.isFetching} />
          </NoticeSlot>
        )}
        <SearchResultsCount total={total ?? products.length} term={filters.term} page={lastLoadedPage} />
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
    </MenuScreenLayout>
  );
};

export default SearchResultsScreen;
