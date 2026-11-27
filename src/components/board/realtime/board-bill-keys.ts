import { QueryKey } from '@tanstack/react-query';
import { boardPaymentsQueryKey, boardProductsQueryKey } from '@/services/board-bill';
import { boardMovementQueryKey } from '@/services/board-movement';
import { BoardBillKey } from './board-socket-events';

type BoardBillQueryKeyBuilder = (movementId: string) => QueryKey;

/** Cada grupo e as chaves que ele relê. `movement` é o dinheiro da movimentação: quem deriva dele entra aqui. */
export const BOARD_BILL_QUERY_KEYS: Record<BoardBillKey, readonly BoardBillQueryKeyBuilder[]> = {
  movement: [boardMovementQueryKey],
  products: [boardProductsQueryKey],
  payments: [boardPaymentsQueryKey],
};

export const ALL_BOARD_BILL_KEYS: readonly BoardBillKey[] = ['movement', 'products', 'payments'];

export function resolveBoardBillQueryKeys(movementId: string, groups: Iterable<BoardBillKey>): QueryKey[] {
  const keys: QueryKey[] = [];

  for (const group of groups) {
    for (const build of BOARD_BILL_QUERY_KEYS[group]) {
      keys.push(build(movementId));
    }
  }

  return keys;
}
