'use client';

import { isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { QueryScreenState, useQueryScreenState } from '@/hooks/use-query-screen-state';
import { fetchProductDetail } from '@/services/product';
import { ProductDetail } from '@/types/product-detail';

export const PRODUCT_DETAIL_QUERY_KEY = 'product-detail';

// Detalhe de produto muda por publicação no admin, não por segundo. A janela evita refazer o
// request a cada abertura do mesmo card dentro da sessão.
const PRODUCT_DETAIL_STALE_TIME = 5 * 60 * 1000;
const MAX_RETRIES = 2;

// 4xx é resposta de negócio (404: a mesa não vende o produto): repetir não muda nada e prenderia o
// cliente no esqueleto pelos retries do padrão.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error) && error.response !== undefined && error.response.status < 500) {
    return false;
  }

  return failureCount < MAX_RETRIES;
}

export interface UseProductDetail {
  detail: ProductDetail | undefined;
  screen: QueryScreenState;
}

export function useProductDetail(publicId: string): UseProductDetail {
  const query = useQuery({
    queryKey: [PRODUCT_DETAIL_QUERY_KEY, publicId],
    queryFn: () => fetchProductDetail(publicId),
    staleTime: PRODUCT_DETAIL_STALE_TIME,
    retry: shouldRetry,
  });

  const screen = useQueryScreenState(query);

  return { detail: query.data, screen };
}
