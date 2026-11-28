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

/** "Conta aberta", "Conta pedida" e "Conta paga". O número da mesa é do `describeBoardPrefix`: deitado ele sai. */
export function describeBillState(state: BillState): string {
  if (state === 'paid') {
    return 'Conta paga';
  }

  return state === 'requested' ? 'Conta pedida' : 'Conta aberta';
}

export function describeBoardPrefix(boardNumber: string): string {
  return `Mesa ${boardNumber} · `;
}
