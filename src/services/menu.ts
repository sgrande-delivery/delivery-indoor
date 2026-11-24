import { MenuCategory } from '@/types/menu-category';
import { ProductSummary } from '@/types/product';
import { ProductPage, ProductPageResponse } from '@/types/product-page';
import { api } from './api';
import { boardCatalogParams } from './catalog-environment';

// O teto da rota (`limit` 1–200): as trilhas da home saem numa requisição só.
export const MENU_PRODUCTS_LIMIT = 200;

// Múltiplo de 2 e de 3: enche a grade do tablet sem linha manca.
export const CATALOG_PAGE_LIMIT = 24;

export async function fetchCategories(): Promise<MenuCategory[]> {
  const response = await api.get<{ data: MenuCategory[] }>('/categories/v2', { params: boardCatalogParams({}) });

  return response.data.data;
}

export async function fetchMenuProducts(): Promise<ProductSummary[]> {
  const response = await api.get<{ data: ProductSummary[] }>('/products/v2', {
    params: boardCatalogParams({ limit: MENU_PRODUCTS_LIMIT }),
  });

  return response.data.data;
}

/** `only_offers` vai como `1` (`true` é 422), e a ordenação por desconto é do servidor. */
export async function fetchOfferProducts(limit: number): Promise<ProductSummary[]> {
  const response = await api.get<{ data: ProductSummary[] }>('/products/v2', {
    params: boardCatalogParams({ only_offers: 1, sort: 'discount_desc', limit }),
  });

  return response.data.data;
}

/**
 * O recorte da resposta para o formato de `ProductPage`: a resposta traz `meta.facets` e o tipo não,
 * e sem este passo as facetas ficariam no cache do React Query ao lado de páginas sem elas.
 */
export function selectProductPage(payload: ProductPageResponse): ProductPage {
  const { total, per_page, current_page, last_page, has_more } = payload.meta;

  return { data: payload.data, meta: { total, per_page, current_page, last_page, has_more } };
}

/** Sem `sort`: vale o `newest` da rota. */
export async function fetchCategoryPage(categoryId: number, page: number): Promise<ProductPage> {
  const response = await api.get<ProductPageResponse>('/products/v2', {
    params: boardCatalogParams({ category_id: categoryId, page, limit: CATALOG_PAGE_LIMIT }),
  });

  return selectProductPage(response.data);
}
