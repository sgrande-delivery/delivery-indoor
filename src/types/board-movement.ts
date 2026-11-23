export interface BoardMovementSection {
  id: string;
  key: string;
  label: string;
  icon: string | null;
  color_hue: number | null;
}

export interface BoardMovementBoard {
  id: string;
  number: string;
  section_id: string | null;
  default_pax: number | null;
  customer_name_required: boolean;
  section: BoardMovementSection | null;
}

export interface BoardMovementAdminUser {
  id: number;
  name: string;
  color_hue: number | null;
}

/** O model devolve o cliente inteiro (e-mail, telefone, CPF); o app declara e exibe só o nome. */
export interface BoardMovementCustomer {
  id: number;
  name: string;
}

/** `GET /boardMovements/{id}` — `BoardMovementDetailPresenter`. Valores em real (float). */
export interface BoardMovementDetail {
  id: string;
  board_id: string;
  restaurant_uuid: string;
  is_open: boolean;
  pax: number | null;
  tip_pct: number;
  tip_amount: number;
  subtotal: number;
  discount: number;
  /** `max(0, subtotal − discount) + tip_amount` */
  total_due: number;
  total_paid: number;
  is_board_paid: boolean;
  opened_at: string;
  first_order_at: string | null;
  bill_requested_at: string | null;
  paid_at: string | null;
  freed_at: string | null;
  admin_user: BoardMovementAdminUser | null;
  customer: BoardMovementCustomer | null;
  board: BoardMovementBoard | null;
}

/** O que o provider entrega em `ready`. */
export type OpenBoardMovement = BoardMovementDetail & { is_open: true; board: BoardMovementBoard };
