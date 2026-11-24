'use client';

import { useMemo } from 'react';
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';
import { fetchCategoryPage } from '@/services/menu';
import { ProductSummary } from '@/types/product';
import { ProductPage } from '@/types/product-page';

const CATEGORY_STALE_TIME = 5 * 60 * 1000;

/** Fora do prefixo `['menu', 'products']` da home: invalidar um não derruba o outro. */
export function categoryProductsQueryKey(categoryId: number) {
  return ['menu', 'category-products', categoryId] as const;
}

export interface UseCategoryProducts {
  query: UseInfiniteQueryResult<InfiniteData<ProductPage>, Error>;
  /** Achatado e sem duplicata por `public_id`. */
  products: ProductSummary[];
  /** `meta.total` da primeira página. */
  total: number | null;
}

/**
 * A ordem é `newest`: um produto publicado entre a página 1 e a 2 empurra um item para a página seguinte, por isso o
 * dedupe. Produto desativado não entra (RN-09), como na home.
 */
export function flattenUniqueProducts(pages: ProductPage[]): ProductSummary[] {
  const seen = new Set<string>();
  const products: ProductSummary[] = [];

  for (const page of pages) {
    for (const product of page.data) {
      if (product.activated && !seen.has(product.public_id)) {
        seen.add(product.public_id);
        products.push(product);
      }
    }
  }

  return products;
}

export function useCategoryProducts(categoryId: number): UseCategoryProducts {
  const query = useInfiniteQuery({
    queryKey: categoryProductsQueryKey(categoryId),
    queryFn: ({ pageParam }) => fetchCategoryPage(categoryId, pageParam),
    initialPageParam: 1,
    // O cursor é do servidor: nenhuma conta sobre `total`/`per_page`.
    getNextPageParam: lastPage => (lastPage.meta.has_more ? lastPage.meta.current_page + 1 : undefined),
    staleTime: CATEGORY_STALE_TIME,
  });

  const pages = query.data?.pages;
  const products = useMemo(() => flattenUniqueProducts(pages ?? []), [pages]);

  return { query, products, total: pages?.[0]?.meta.total ?? null };
}
