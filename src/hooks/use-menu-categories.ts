'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchCategories } from '@/services/menu';
import { MenuCategory } from '@/types/menu-category';

export const menuCategoriesQueryKey = ['menu', 'categories'] as const;

const MENU_CATEGORIES_STALE_TIME = 5 * 60 * 1000;

/**
 * Sem filtro por `is_available_on_delivery`: categoria só de mesa traz `false` ali, e a
 * disponibilidade por ambiente é do servidor.
 */
export function selectVisibleCategories(categories: MenuCategory[]): MenuCategory[] {
  return categories
    .filter(category => category.activated && category.products_count > 0)
    .sort((first, second) => second.relevance - first.relevance);
}

export function useMenuCategories(): UseQueryResult<MenuCategory[]> {
  return useQuery({
    queryKey: menuCategoriesQueryKey,
    queryFn: fetchCategories,
    staleTime: MENU_CATEGORIES_STALE_TIME,
  });
}
