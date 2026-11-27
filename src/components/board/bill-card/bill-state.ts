import type { BoardMovementDetail } from '@/types/board-movement';

export type BillState = 'open' | 'requested' | 'paid';

/** Paga vence conta pedida, que vence aberta: pedir a conta não trava a conta, só muda o rótulo. */
export function resolveBillState(
  movement: Pick<BoardMovementDetail, 'is_board_paid' | 'bill_requested_at'>
): BillState {
  if (movement.is_board_paid) {
    return 'paid';
  }

  return movement.bill_requested_at !== null ? 'requested' : 'open';
}

export function describeBillState(state: BillState, boardNumber: string): string {
  if (state === 'paid') {
    return 'Conta paga';
  }

  return `Mesa ${boardNumber} · ${state === 'requested' ? 'conta pedida' : 'conta aberta'}`;
}
