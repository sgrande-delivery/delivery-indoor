export interface BoardTotalsChangedPayload {
  id: string;
  board_id: string;
  restaurant_uuid: string;
  subtotal: number;
  tip_amount: number;
  total_due: number;
  total_paid: number;
  is_board_paid: boolean;
}
