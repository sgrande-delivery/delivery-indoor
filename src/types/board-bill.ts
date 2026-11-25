import { Image } from './image';

/** `round_status` do item (delivery-api#1754, `BoardRoundStatusEnum`). */
export type BoardRoundStatus = 'sent' | 'preparing' | 'ready' | 'delivered' | 'canceled';

export interface BoardOptionSelection {
  option_group_item_id: number | null;
  option_group_id: number | null;
  name: string;
  quantity: number;
  /** Centavos inteiros (`Money::getValue()`), ao contrário do resto do payload. A conta não o exibe nem soma. */
  unit_price: number;
  option_group_kind: string | null;
  option_group_name: string | null;
}

export interface BoardRemovedIngredient {
  /** Vazio no item legado: não é chave única. */
  public_id: string;
  name: string;
}

/** Item de `GET /boardMovements/{id}/products` (`BoardMovementProductPresenter`). Dinheiro em real (float). */
export interface BoardProductItem {
  id: number;
  name: string;
  /** Float; fracionário no item dividido. */
  amount: number;
  /** Unitário, já com adicionais e complementos. */
  price: number;
  final_price: number;
  person: string | null;
  image: Image | null;
  category_kind: string | null;
  observations: string | null;
  round: number;
  order_public_id: string;
  /** `null` enquanto a api publicada não traz o campo, ou com valor fora do vocabulário. */
  round_status: BoardRoundStatus | null;
  /** `null` enquanto a api publicada não traz o campo. */
  order_created_at: string | null;
  option_selections: BoardOptionSelection[];
  removed_ingredients: BoardRemovedIngredient[];
}

export interface BoardProducts {
  products: BoardProductItem[];
}

/** `payment_method` de `GET /boardMovements/{id}/payments`. */
export interface BoardPaymentMethod {
  id: number;
  method: string;
  kind: string;
  mode: string;
}

/** Item de `GET /boardMovements/{id}/payments` (model `BoardMovementPayment`). Dinheiro em real (float). */
export interface BoardPayment {
  id: string;
  value: number;
  person: string | null;
  created_at: string;
  payment_method: BoardPaymentMethod | null;
}
