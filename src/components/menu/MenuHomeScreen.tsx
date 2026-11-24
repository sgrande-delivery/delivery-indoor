'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import RouteErrorState from '@/components/error/RouteErrorState';
import { EmptyState } from '@/components/ui';
import { useQueryScreenState } from '@/hooks/use-query-screen-state';
import { categoryRailMetrics, spacingScale } from '@/theme';
import HomeOfferRail from './HomeOfferRail';
import HomeProductRail from './HomeProductRail';
import MenuCategoryRail from './MenuCategoryRail';
import MenuScreenLayout from './MenuScreenLayout';
import MenuSearchChip from './MenuSearchChip';
import MenuSectionList from './MenuSectionList';
import MenuSkeleton from './MenuSkeleton';
import { MENU_ERROR_DESCRIPTION, MENU_ERROR_TITLE, MENU_REFRESH_ERROR } from './menu-copy';
import { useMenuHome } from './use-menu-home';
import { tabletGutter } from './tablet-gutter';

const EMPTY_TITLE = 'Nenhum produto para mostrar';
const EMPTY_DESCRIPTION = 'O cardápio da mesa está sem itens no momento. Chame o garçom se quiser pedir algo.';
const CATEGORIES_ERROR = 'Não foi possível carregar as categorias.';

// A navegação inferior é irmã da região de conteúdo no shell; este respiro é só o fim da última trilha.
const Root = styled('div')({
  paddingBlockEnd: spacingScale.lg,
});

const NoticeSlot = styled('div')(
  {
    paddingBlockStart: categoryRailMetrics.paddingBlockStart,
    paddingInline: categoryRailMetrics.paddingInline,
  },
  tabletGutter('paddingInline')
);

const MenuHomeScreen: React.FC = () => {
  const home = useMenuHome();
  const screen = useQueryScreenState(home.products);
  const { categories } = home;

  if (screen.view === 'skeleton') {
    return <MenuSkeleton />;
  }

  if (screen.view === 'error') {
    return (
      <RouteErrorState
        error={screen.error}
        failureStreak={screen.failureStreak}
        onRetry={screen.retry}
        title={MENU_ERROR_TITLE}
        description={MENU_ERROR_DESCRIPTION}
      />
    );
  }

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
      <MenuCategoryRail categories={home.visibleCategories} currentCategoryId={null} trailing={<MenuSearchChip />} />
    );

  return (
    <MenuScreenLayout
      header={
        <>
          {screen.isRefreshFailed && (
            <NoticeSlot>
              <InlineError message={MENU_REFRESH_ERROR} onRetry={screen.retry} isRetrying={home.products.isFetching} />
            </NoticeSlot>
          )}
          {rail}
        </>
      }
    >
      <Root>
        <HomeOfferRail {...home.offers} />
        <HomeProductRail id="menu-most-ordered" title="Mais pedidos" {...home.mostOrdered} />
        <MenuSectionList sections={home.sections} />
        {home.sections.length === 0 && (
          <EmptyState icon="restaurant_menu" title={EMPTY_TITLE} description={EMPTY_DESCRIPTION} />
        )}
      </Root>
    </MenuScreenLayout>
  );
};

export default MenuHomeScreen;
