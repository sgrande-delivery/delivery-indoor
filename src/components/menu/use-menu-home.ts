'use client';

import { useMemo } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { selectVisibleCategories, useMenuCategories } from '@/hooks/use-menu-categories';
import { fetchMostOrderedProducts } from '@/services/home';
import { fetchMenuProducts, fetchOfferProducts } from '@/services/menu';
import { MenuCategory } from '@/types/menu-category';
import { ProductSummary } from '@/types/product';
import { HOME_OFFERS_LIMIT, HomeOffer, selectHomeOffers } from './home-offers';
import { createMenuSections, MenuSectionData } from './menu-sections';

export const menuProductsQueryKey = ['menu', 'products'] as const;
export const menuOffersQueryKey = ['menu', 'offers'] as const;
export const menuMostOrderedQueryKey = ['menu', 'most-ordered'] as const;

const MENU_HOME_STALE_TIME = 5 * 60 * 1000;

export interface HomeRail<T> {
  items: T[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export interface UseMenuHome {
  /** A que decide a tela. */
  products: UseQueryResult<ProductSummary[]>;
  categories: UseQueryResult<MenuCategory[]>;
  visibleCategories: MenuCategory[];
  sections: MenuSectionData[];
  offers: HomeRail<HomeOffer>;
  mostOrdered: HomeRail<ProductSummary>;
}

function toRail<T>(query: UseQueryResult<T[]>): HomeRail<T> {
  const { data, isError, isFetching, refetch } = query;

  return {
    items: data ?? [],
    isLoading: data === undefined && (query.isPending || isFetching),
    isError: data === undefined && isError && !isFetching,
    onRetry: () => {
      void refetch();
    },
  };
}

function selectActivated(products: ProductSummary[]): ProductSummary[] {
  return products.filter(product => product.activated);
}

export function useMenuHome(): UseMenuHome {
  const categories = useMenuCategories();

  const products = useQuery({
    queryKey: menuProductsQueryKey,
    queryFn: fetchMenuProducts,
    staleTime: MENU_HOME_STALE_TIME,
  });

  const offersQuery = useQuery({
    queryKey: menuOffersQueryKey,
    queryFn: () => fetchOfferProducts(HOME_OFFERS_LIMIT),
    select: selectHomeOffers,
    staleTime: MENU_HOME_STALE_TIME,
  });

  const mostOrderedQuery = useQuery({
    queryKey: menuMostOrderedQueryKey,
    queryFn: fetchMostOrderedProducts,
    select: selectActivated,
    staleTime: MENU_HOME_STALE_TIME,
  });

  const visibleCategories = useMemo(() => selectVisibleCategories(categories.data ?? []), [categories.data]);
  const sections = useMemo(
    () => createMenuSections(categories.data ?? [], products.data ?? []),
    [categories.data, products.data]
  );

  return {
    products,
    categories,
    visibleCategories,
    sections,
    offers: toRail(offersQuery),
    mostOrdered: toRail(mostOrderedQuery),
  };
}
