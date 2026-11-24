export type ProductKind = 'standard' | 'buildable';

export interface ProductCategorySummary {
  id: number;
  name: string;
}

export interface ProductRatingSummary {
  average: number | null;
  total: number;
}

/**
 * `ProductSummaryPresenter` (`GET /products/v2` e `/products/v2/most-ordered`). `price`,
 * `special_price` e `discount_percent` saem do servidor, os dois primeiros em **centavos**, e são os
 * do ambiente pedido (`board`). `price` nulo ou zero é "o servidor não resolveu", não "de graça".
 *
 * `is_favorite` vem no payload da busca e é ignorado (a mesa não tem favoritos); o `most-ordered` o
 * omite. `matched_option` só aparece na busca.
 */
export interface ProductSummary {
  id: number;
  public_id: string;
  name: string;
  description: string | null;
  kind: ProductKind;
  activated: boolean;
  category: ProductCategorySummary | null;
  image_url: string | null;
  price: number | null;
  special_price: number | null;
  discount_percent: number | null;
  rating: ProductRatingSummary;
  is_favorite?: boolean;
  matched_option?: { item_name: string; group_name: string };
}
