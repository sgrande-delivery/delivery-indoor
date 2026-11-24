// `GET /categories/v2` (`CategorySummaryPresenter`). `is_available_on_delivery` é coluna do registro e não filtra nada na mesa.
export interface MenuCategory {
  id: number;
  name: string;
  relevance: number;
  activated: boolean;
  is_available_on_delivery: boolean;
  products_count: number; // do ambiente pedido (delivery-api#1625)
}
