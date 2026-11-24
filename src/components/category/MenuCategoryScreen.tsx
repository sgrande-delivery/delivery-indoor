'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import RouteErrorState from '@/components/error/RouteErrorState';
import MenuCategoryRail from '@/components/menu/MenuCategoryRail';
import MenuScreenLayout from '@/components/menu/MenuScreenLayout';
import MenuSearchChip from '@/components/menu/MenuSearchChip';
import PhoneOnly from '@/components/menu/PhoneOnly';
import ProductGridSkeleton from '@/components/menu/ProductGridSkeleton';
import { useMenuScreenScroller } from '@/components/menu/menu-scroller';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { productGridMetrics } from '@/components/menu/product-grid-metrics';
import { tabletGutter } from '@/components/menu/tablet-gutter';
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

// O fim da lista de linhas do celular; o tablet leva o respiro na própria grade.
const Body = styled('div')({
  paddingBlockEnd: spacingScale.lg,
  [`@media ${tabletShellMediaQuery}`]: {
    paddingBlockEnd: 0,
  },
});

const NoticeSlot = styled('div')({
  paddingBlockStart: categoryRailMetrics.paddingBlockStart,
  paddingInline: categoryRailMetrics.paddingInline,
  ...tabletGutter('paddingInline'),
});

// No tablet o vazio ocupa a região e se centra nela (artboard `Estados · tablet vazio`).
const EmptySlot = styled('div')({
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minBlockSize: '100%',
    boxSizing: 'border-box',
    padding: productGridMetrics.emptyPadding,
  },
});

// No tablet a trilha fixa já deixa 16 embaixo; no celular ela não deixa nada, e o rótulo leva o mesmo respiro (16 + 4,
// como no artboard), para colar na lista que ele nomeia e não na trilha.
const labelMarginBlockStart = {
  marginBlockStart: spacingScale.md + searchSectionMetrics.labelMarginBlockStart,
  [`@media ${tabletShellMediaQuery}`]: {
    marginBlockStart: searchSectionMetrics.labelMarginBlockStart,
  },
} as const;

const SectionLabel = styled('h2')(
  ({ theme }) => ({
    margin: 0,
    paddingInline: searchSectionMetrics.bodyPaddingInline,
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(searchSectionMetrics.labelFontSize),
    fontWeight: searchSectionMetrics.labelFontWeight,
    lineHeight: searchSectionMetrics.labelLineHeight,
    letterSpacing: searchSectionMetrics.labelLetterSpacing,
    textTransform: 'uppercase',
    color: theme.vars.palette.surface.muted,
  }),
  labelMarginBlockStart,
  tabletGutter('paddingInline')
);

const SkeletonLabelSlot = styled('div')(
  { paddingInline: searchSectionMetrics.bodyPaddingInline },
  labelMarginBlockStart,
  tabletGutter('paddingInline')
);

const MenuCategoryScreen: React.FC<MenuCategoryScreenProps> = ({ categoryId }) => {
  const { query, products, total } = useCategoryProducts(categoryId);
  const screen = useQueryScreenState(query);
  const categories = useMenuCategories();
  const isOffline = useIsOffline();
  const { regionRef, scrollerRef, isTablet } = useMenuScreenScroller();
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
    loadMore,
    scrollerRef
  );

  // Trocar de categoria não remonta a tela e quem rola (a região no tablet, o shell no celular) continua onde estava.
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
      <MenuCategoryRail categories={visibleCategories} currentCategoryId={categoryId} trailing={<MenuSearchChip />} />
    );

  if (screen.view === 'error') {
    return (
      <MenuScreenLayout header={rail} regionRef={regionRef}>
        <RouteErrorState
          error={screen.error}
          failureStreak={screen.failureStreak}
          onRetry={screen.retry}
          title={MENU_ERROR_TITLE}
          description={MENU_ERROR_DESCRIPTION}
        />
      </MenuScreenLayout>
    );
  }

  if (screen.view === 'skeleton') {
    return (
      <MenuScreenLayout header={rail} regionRef={regionRef}>
        <SkeletonLabelSlot>
          <Skeleton variant="text" width={LABEL_SKELETON_WIDTH} height={searchSectionMetrics.labelFontSize} />
        </SkeletonLabelSlot>
        <PhoneOnly>
          <CategoryListSkeleton />
        </PhoneOnly>
        <ProductGridSkeleton />
      </MenuScreenLayout>
    );
  }

  // Sem produto visível mas com página seguinte (a primeira pode vir só com desativados), a lista segue com a sentinela.
  if (products.length === 0 && !query.hasNextPage) {
    return (
      <MenuScreenLayout header={rail} regionRef={regionRef}>
        <EmptySlot>
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
        </EmptySlot>
      </MenuScreenLayout>
    );
  }

  const count = total ?? products.length;

  return (
    <MenuScreenLayout header={rail} regionRef={regionRef}>
      <Body>
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
          variant={isTablet ? 'grid' : 'list'}
        />
      </Body>
    </MenuScreenLayout>
  );
};

export default MenuCategoryScreen;
