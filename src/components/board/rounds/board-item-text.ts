import { moneyFormat } from '@/helpers/numberFormat';
import type { BoardProductItem } from '@/types/board-bill';
import { formatBoardQuantity } from '../board-summary';

const META_SEPARATOR = ' · ';

export function describeBoardItemTitle(item: Pick<BoardProductItem, 'amount' | 'name'>): string {
  return `${formatBoardQuantity(item.amount)}× ${item.name}`;
}

/**
 * "Marina", "Marina · 2 x R$ 26,90" ou só "2 x R$ 26,90". O unitário é o `price` do contrato, que já inclui
 * adicionais e complementos, e só aparece com quantidade maior que 1. `null` quando não há o que mostrar.
 */
export function describeBoardItemMeta(item: Pick<BoardProductItem, 'amount' | 'person' | 'price'>): string | null {
  const parts: string[] = [];

  if (item.person) {
    parts.push(item.person);
  }

  if (item.amount > 1) {
    parts.push(`${formatBoardQuantity(item.amount)} x ${moneyFormat(item.price)}`);
  }

  return parts.length > 0 ? parts.join(META_SEPARATOR) : null;
}

export function describeBoardExtra(extra: { name: string; quantity: number }): string {
  return extra.quantity > 1 ? `+ ${formatBoardQuantity(extra.quantity)}x ${extra.name}` : `+ ${extra.name}`;
}

export function describeBoardRemoved(name: string): string {
  return `S/ ${name}`;
}

export function describeBoardRoundTitle(round: number, clock: string | null): string {
  return clock === null ? `Pedido ${round}` : `Pedido ${round}${META_SEPARATOR}${clock}`;
}
