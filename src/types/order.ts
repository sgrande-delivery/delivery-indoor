/** `POST /cart/{cartId}/checkout` → `OrderPresenter`. Valores em centavos. O `status` cru não entra: o estado da rodada vem da conta (`round_status`). */
export interface PlacedOrder {
  /** uuid do pedido; é o `order_public_id` do item da conta. */
  id: string;
  customer_name: string;
  board_movement_id: string | null;
  total: number;
}
