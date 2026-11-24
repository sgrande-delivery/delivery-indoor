import { ProductSummary } from '@/types/product';
import { api } from './api';
import { boardCatalogParams } from './catalog-environment';

// Os defaults medidos da rota, escritos à mão para o contrato ficar explícito.
export const MOST_ORDERED_WINDOW_DAYS = 30;
export const MOST_ORDERED_LIMIT = 10;

export async function fetchMostOrderedProducts(): Promise<ProductSummary[]> {
  const response = await api.get<{ data: ProductSummary[] }>('/products/v2/most-ordered', {
    params: boardCatalogParams({ window: MOST_ORDERED_WINDOW_DAYS, limit: MOST_ORDERED_LIMIT }),
  });

  return response.data.data;
}
