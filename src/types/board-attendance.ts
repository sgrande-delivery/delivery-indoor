import type { BoardWaiterCall } from './board-movement';

/**
 * `POST /boardMovements/{id}/waiter-calls` (delivery-api#1610): 201 criou a chamada, 200 devolve a que já está em
 * aberto na janela. A mesma forma nos dois.
 */
export interface WaiterCallResponse extends BoardWaiterCall {
  board_movement_id: string;
}

/** `PATCH /boardMovements/{id}/request-bill`: a primeira vez grava, as seguintes devolvem o mesmo horário. */
export interface RequestBillResponse {
  bill_requested_at: string;
}
