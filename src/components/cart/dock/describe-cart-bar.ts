import { formatCents } from '@/helpers/money';

export interface CartBarSummary {
  itemCount: number;
  itemsLabel: string;
  totalLabel: string;
  accessibleLabel: string;
  announcement: string;
}

/** O que a barra da sacola diz. O total é o do servidor, só formatado; a quantidade é a soma das linhas. */
export function describeCartBar(itemCount: number, totalCents: number): CartBarSummary {
  const itemsLabel = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;
  const totalLabel = formatCents(totalCents);

  return {
    itemCount,
    itemsLabel,
    totalLabel,
    accessibleLabel: `Ver sacola, ${itemsLabel}, total ${totalLabel}`,
    announcement: `Sua sacola, ${itemsLabel}, total ${totalLabel}`,
  };
}
