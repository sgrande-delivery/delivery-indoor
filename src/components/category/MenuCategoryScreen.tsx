'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import RouteErrorState from '@/components/error/RouteErrorState';
import MenuCategoryRail from '@/components/menu/MenuCategoryRail';
import { useAppScroller } from '@/components/shell/AppShell';
import { MENU_ERROR_DESCRIPTION, MENU_ERROR_TITLE, MENU_REFRESH_ERROR } from '@/components/menu/menu-copy';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { resolveScrollBehavior } from '@/helpers/scroll-behavior';
import { useLoadMore } from '@/hooks/use-load-more';
import { selectVisibleCategories, useMenuCategories } from '@/hooks/use-menu-categories';
import { useQueryScreenState } from '@/hooks/use-query-screen-state';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { categoryRouteHref } from '@/routes/app-routes';
import { categoryRailMetrics, fontFamilies, pxToRem, searchSectionMetrics, spacingScale } from '@/theme';
import CategoryListSkeleton from './CategoryListSkeleton';
import CategoryProductList from './CategoryProductList';
import { useCategoryProducts } from './use-category-products';

const EMPTY_TITLE = 'Nenhum produto para mostrar';
const UNKNOWN_CATEGORY_NAME = 'Esta categoria';
const CATEGORIES_ERROR = 'Não foi possível carregar as categorias.';
const LABEL_SKELETON_WIDTH = 120;

export interface MenuCategoryScreenProps {
  categoryId: number;
}

const Root = styled('div')({
  paddingBlockEnd: spacingScale.lg,
});

const NoticeSlot = styled('div')({
  paddingBlockStart: categoryRailMetrics.paddingBlockStart,
  paddingInline: categoryRailMetrics.paddingInline,
});

const SectionLabel = styled('h2')(({ theme }) => ({
  margin: 0,
  paddingInline: searchSectionMetrics.bodyPaddingInline,
  marginBlockStart: searchSectionMetrics.labelMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(searchSectionMetrics.labelFontSize),
  fontWeight: searchSectionMetrics.labelFontWeight,
  lineHeight: searchSectionMetrics.labelLineHeight,
  letterSpacing: searchSectionMetrics.labelLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.muted,
}));

const SkeletonLabelSlot = styled('div')({
  paddingInline: searchSectionMetrics.bodyPaddingInline,
  marginBlockStart: searchSectionMetrics.labelMarginBlockStart,
});

const MenuCategoryScreen: React.FC<MenuCategoryScreenProps> = ({ categoryId }) => {
  const { query, products, total } = useCategoryProducts(categoryId);
  const screen = useQueryScreenState(query);
  const categories = useMenuCategories();
  const isOffline = useIsOffline();
  const scrollerRef = useAppScroller();
  const lastCategoryId = useRef(categoryId);

  const visibleCategories = selectVisibleCategories(categories.data ?? []);
  const category = visibleCategories.find(item => item.id === categoryId);
  const otherCategory = visibleCategories.find(item => item.id !== categoryId);

  const { fetchNextPage } = query;
  const loadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const sentinelRef = useLoadMore(
    query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError && !isOffline,
    loadMore
  );

  // Trocar de categoria não remonta a tela e o scroller do shell continua onde estava.
  useEffect(() => {
    if (lastCategoryId.current === categoryId) {
      return;
    }

    lastCategoryId.current = categoryId;
    scrollerRef.current?.scrollTo({ top: 0, behavior: resolveScrollBehavior() });
  }, [categoryId, scrollerRef]);

  const categoryName = category?.name ?? UNKNOWN_CATEGORY_NAME;

  const rail =
    categories.isError && categories.data === undefined ? (
      <NoticeSlot>
        <InlineError
          message={CATEGORIES_ERROR}
          onRetry={() => void categories.refetch()}
          isRetrying={categories.isFetching}
        />
      </NoticeSlot>
    ) : (
      <MenuCategoryRail categories={visibleCategories} currentCategoryId={categoryId} />
    );

  if (screen.view === 'error') {
    return (
      <Root>
        {rail}
        <RouteErrorState
          error={screen.error}
          failureStreak={screen.failureStreak}
          onRetry={screen.retry}
          title={MENU_ERROR_TITLE}
          description={MENU_ERROR_DESCRIPTION}
        />
      </Root>
    );
  }

  if (screen.view === 'skeleton') {
    return (
      <Root>
        {rail}
        <SkeletonLabelSlot>
          <Skeleton variant="text" width={LABEL_SKELETON_WIDTH} height={searchSectionMetrics.labelFontSize} />
        </SkeletonLabelSlot>
        <CategoryListSkeleton />
      </Root>
    );
  }

  // Sem produto visível mas com página seguinte (a primeira pode vir só com desativados), a lista segue com a sentinela.
  if (products.length === 0 && !query.hasNextPage) {
    return (
      <Root>
        {rail}
        <EmptyState
          icon="restaurant_menu"
          title={EMPTY_TITLE}
          description={`${categoryName} está sem itens no momento. Escolha outra categoria aqui em cima — ou chame o garçom se quiser pedir algo que não está no cardápio.`}
          action={
            otherCategory ? (
              <Button variant="primary" component={Link} href={categoryRouteHref(otherCategory.id)}>
                {`Ver ${otherCategory.name}`}
              </Button>
            ) : undefined
          }
        />
      </Root>
    );
  }

  const count = total ?? products.length;

  return (
    <Root>
      {rail}
      <SectionLabel>{`${categoryName} · ${count} ${count === 1 ? 'item' : 'itens'}`}</SectionLabel>
      {query.isRefetchError && (
        <NoticeSlot>
          <InlineError message={MENU_REFRESH_ERROR} onRetry={screen.retry} isRetrying={query.isFetching} />
        </NoticeSlot>
      )}
      <CategoryProductList
        products={products}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        nextPageError={query.isFetchNextPageError}
        onRetryNextPage={loadMore}
        sentinelRef={sentinelRef}
      />
    </Root>
  );
};

export default MenuCategoryScreen;
