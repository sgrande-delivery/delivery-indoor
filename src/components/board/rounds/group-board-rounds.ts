import type { BoardProductItem, BoardRoundStatus } from '@/types/board-bill';

export interface BoardRound {
  orderPublicId: string;
  round: number;
  status: BoardRoundStatus | null;
  orderedAt: string | null;
  items: BoardProductItem[];
}

/**
 * Um grupo por pedido, da rodada mais recente para a mais antiga. Os itens ficam na ordem da API, e o estado e a
 * hora saem do primeiro item: são constantes no pedido, e nada é deduzido quando faltam.
 */
export function groupBoardRounds(products: readonly BoardProductItem[]): BoardRound[] {
  const rounds = new Map<string, BoardRound>();

  for (const product of products) {
    const existing = rounds.get(product.order_public_id);

    if (existing) {
      existing.items.push(product);
      continue;
    }

    rounds.set(product.order_public_id, {
      orderPublicId: product.order_public_id,
      round: product.round,
      status: product.round_status,
      orderedAt: product.order_created_at,
      items: [product],
    });
  }

  return [...rounds.values()].sort((left, right) => right.round - left.round);
}
