export const RATING_STAR_COUNT = 5;

// Meia estrela a partir de meia nota, e nunca arredondando para cima: 4,9 é quatro cheias e uma
// metade, não cinco.
const HALF_STAR_THRESHOLD = 0.5;

export type RatingStarShape = 'full' | 'half' | 'empty';

export function describeRatingStars(average: number): RatingStarShape[] {
  const full = Math.min(Math.floor(average), RATING_STAR_COUNT);
  const hasHalf = full < RATING_STAR_COUNT && average - full >= HALF_STAR_THRESHOLD;

  return Array.from({ length: RATING_STAR_COUNT }, (unused, index) => {
    if (index < full) {
      return 'full';
    }

    return index === full && hasHalf ? 'half' : 'empty';
  });
}

export function describeReviewCount(count: string, total: number): string {
  return `${count} ${total === 1 ? 'avaliação' : 'avaliações'}`;
}
