import { ProductKind, ProductRatingSummary } from './product';

// O `kind` do grupo é dica de rótulo do admin e **não** decide layout nem escolha ("Borda" chega como
// `other`, e o preço dela cai em `size_prices.flavor`). Por isso é `string` e não união fechada.
export interface OptionGroupItem {
  id: number;
  product_public_id: string | null;
  name: string | null;
  description: string | null;
  price_override: number | null; // centavos
  taste_amount: number | null;
  flavor_slots: number | null;
  position: number;
  is_default: boolean;
}

export interface OptionGroup {
  id: number;
  public_id: string;
  name: string;
  kind: string;
  min_quantity: number;
  max_quantity: number;
  is_required: boolean;
  items: OptionGroupItem[];
}

export interface RecipeLine {
  ingredient_public_id: string | null;
  ingredient_name: string | null;
  quantity: number;
  is_optional: boolean;
}

export interface SizePrice {
  modifier_item_id: number;
  size_item_id: number;
  modifier_public_id: string | null;
  size_public_id: string | null;
  price: number;
  special_price: number | null;
  discount_percent: number | null;
}

export interface ProductDetailImage {
  id: number;
  image_url: string;
  image_thumb_url: string | null;
}

/**
 * `ShowProductPresenter` (`GET /products/v2/{publicId}?environment=board`). Valores em centavos, do
 * ambiente pedido. `size_prices` sempre traz as chaves `flavor` e `border`. `promotion` só vem
 * quando há preço por célula.
 */
export interface ProductDetail {
  id: number;
  public_id: string;
  name: string;
  description: string | null;
  calories: number | null;
  serves: number | null;
  kind: ProductKind;
  activated: boolean;
  category_id: number | null;
  image: ProductDetailImage | null;
  price: number | null;
  special_price: number | null;
  discount_percent: number | null;
  rating: ProductRatingSummary;
  is_favorite: boolean;
  option_groups: OptionGroup[];
  size_prices: Record<string, SizePrice[]>;
  recipe: RecipeLine[];
  promotion?: { applies: boolean; target: 'cells' | 'line' | null };
}

export interface PriceOptionBreakdown {
  option_group_item_id: number;
  option_group_id: number;
  name: string;
  price_delta: number;
}

export interface PriceFlavorBreakdown {
  flavor_item_id: number;
  flavor_product_id: number;
  price: number;
  taste_amount: number;
}

/** `ProductItemPricePresenter` (`POST /products/v2/{publicId}/price`), tudo em centavos. O total do CTA é o `line_total`. */
export interface ProductPrice {
  product_id: number;
  public_id: string;
  quantity: number;
  base_price: number;
  unit_price: number;
  line_total: number;
  original_unit_price: number | null;
  original_line_total: number | null;
  applied_promotion: { id: number; name: string } | null;
  promotion_nullified_by_combination: boolean;
  option_breakdowns: PriceOptionBreakdown[];
  flavor_breakdowns: PriceFlavorBreakdown[];
}
