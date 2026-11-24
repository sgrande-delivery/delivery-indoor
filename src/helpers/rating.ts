import { ProductSummary } from '@/types/product';

export interface RatingDisplay {
  value: string;
  count: string;
  total: number;
  average: number;
}

const valueFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const countFormatter = new Intl.NumberFormat('pt-BR');

/** `null` quando não há o que mostrar: sem média ou sem avaliações (RF-18). */
export function resolveRatingDisplay(rating: ProductSummary['rating']): RatingDisplay | null {
  if (rating.average === null || rating.total <= 0) {
    return null;
  }

  return {
    value: valueFormatter.format(rating.average),
    count: countFormatter.format(rating.total),
    total: rating.total,
    average: rating.average,
  };
}
