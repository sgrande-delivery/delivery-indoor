import type { BoardProductItem } from '@/types/board-bill';

export interface BoardSummary {
  orderCount: number;
  itemCount: number;
}

const quantityFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

/** `itemCount` soma o `amount` (2× Classic Smash são dois itens) e `orderCount` conta os pedidos distintos. */
export function summarizeBoardProducts(
  products: readonly Pick<BoardProductItem, 'amount' | 'order_public_id'>[]
): BoardSummary {
  const orders = new Set<string>();
  let itemCount = 0;

  for (const product of products) {
    orders.add(product.order_public_id);
    itemCount += product.amount;
  }

  // item dividido soma fração (0,333 x 3): 2 casas tiram o ruído do ponto flutuante
  return { orderCount: orders.size, itemCount: Math.round(itemCount * 100) / 100 };
}

export function describeOrderCount(count: number): string {
  return `${quantityFormatter.format(count)} ${count === 1 ? 'pedido' : 'pedidos'}`;
}

export function describeItemCount(count: number): string {
  return `${quantityFormatter.format(count)} ${count === 1 ? 'item' : 'itens'}`;
}

export function describeBoardCount({ orderCount, itemCount }: BoardSummary): string {
  return `${describeOrderCount(orderCount)} · ${describeItemCount(itemCount)}`;
}
