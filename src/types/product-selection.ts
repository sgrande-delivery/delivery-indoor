/** Elemento de `option_selections`: o mesmo no corpo do `/price` e no de `POST /cart/{cartId}/items`. */
export interface OptionSelection {
  option_group_item_id: number; // OptionGroupItem.id — numérico
  quantity?: number; // só quando > 1
}

/** O corpo de `POST /cart/{cartId}/items` (`AddCartItemRequest`), sem `person`: o detalhe monta, a sacola manda como está. */
export interface ProductSelection {
  product_id: number; // ProductDetail.id — numérico
  quantity: number;
  option_selections: OptionSelection[];
  removed_ingredients: string[]; // RecipeLine.ingredient_public_id (uuid)
  notes: string | null; // trim; vazio vira null
}
