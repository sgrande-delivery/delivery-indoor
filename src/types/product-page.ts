import { ProductSummary } from './product';

/** As ordenações de `GET /products/v2`; a ordem é a que a busca desenha (RF-14). Valor fora da lista é 422. */
export const productSorts = ['best_selling', 'rating', 'discount_desc', 'price_asc', 'price_desc', 'newest'] as const;

export type ProductSort = (typeof productSorts)[number];

export interface SearchFacetCategory {
  id: number;
  name: string;
  count: number;
}

export interface SearchFacetRelaxed {
  filter: string;
  value: string;
  label: string;
  additional_count: number;
}

export interface SearchFacets {
  categories: SearchFacetCategory[];
  relaxed: SearchFacetRelaxed[];
}

/** `has_more` é calculado no servidor (`current_page < last_page`); o front não refaz a conta. */
export interface ProductPageMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  has_more: boolean;
}

/** Resposta crua de `GET /products/v2` — entrada dos recortes, nunca prop de componente. */
export interface ProductPageResponse {
  data: ProductSummary[];
  meta: ProductPageMeta & { facets: SearchFacets };
}

/** O recorte da listagem por categoria: sem facetas. */
export interface ProductPage {
  data: ProductSummary[];
  meta: ProductPageMeta;
}
