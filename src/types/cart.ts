export type CartStatus = 'open' | 'checked_out' | 'abandoned';

export interface CartItemOption {
  id: number;
  option_group_id: number;
  option_group_item_id: number;
  name: string | null;
  quantity: number;
  unit_price: number;
}

export interface CartItemRemovedIngredient {
  ingredient_public_id: string;
  name: string;
}

export interface CartItemPromotion {
  id: number;
  name: string;
  kind: string | null;
}

export interface AppliedPromotion {
  promotion_id: number;
  name: string;
  kind: string | null;
  trigger_kind: string | null;
  discount_value: number;
  cart_item_id: number | null;
  reason_code: 'applied';
}

/** `CartItemPresenter`. Valores em centavos. */
export interface CartItem {
  id: number;
  cart_id: string;
  product_id: number;
  product_public_id: string | null;
  name: string | null;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
  options: CartItemOption[];
  removed_ingredients: CartItemRemovedIngredient[];
  promotion: CartItemPromotion | null;
  /** Declarado pelo contrato, ainda não vem na resposta. */
  person: string | null;
}

/** `CartPresenter`. Valores em centavos. */
export interface Cart {
  id: string;
  restaurant_id: number;
  customer_id: number | null;
  session_token: string | null;
  status: CartStatus;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  coupon_id: number | null;
  promotion_id: number | null;
  coupon_code: string | null;
  free_shipping: boolean;
  applied_promotions: AppliedPromotion[];
  expires_at: string | null;
  items: CartItem[];
  created_at: string | null;
  updated_at: string | null;
  /** Declarado pelo contrato, ainda não vem na resposta. */
  board_movement_id: string | null;
}

/**
 * O corpo do `409 checkout_price_changed`, em centavos. Não traz `message` nem `detail`; o `error` é copy técnica da
 * api.
 */
export interface CheckoutPriceChangedBody {
  error?: string;
  status_code: 409;
  internal_code: 'checkout_price_changed';
  previous_total: number;
  new_pricing: { subtotal: number; discount: number; delivery_fee: number; total: number };
  stale_promotions: { promotion_id: number; name: string; reason: string }[];
}
