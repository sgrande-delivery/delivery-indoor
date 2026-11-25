import { cartHeaderMetrics, cartItemMetrics, controlSizes } from '@/theme';

// O que a sacola da mesa desenha e o tema (que veio do client) não tem. Medidas de `Carrinho-Celular` do canvas da
// mesa; o resto vem de `cartHeaderMetrics`, `cartRowMetrics`, `cartItemMetrics`, `cartSummaryMetrics` e
// `cartScreenMetrics`.
const TOUCH_TARGET = controlSizes.md.height;

export const cartMetrics = {
  touchTarget: TOUCH_TARGET,
  // O glifo do voltar (24) e o da lixeira (18) ficam onde o desenho os põe, e o alvo de 44 sangra para fora deles.
  backBleed: (TOUCH_TARGET - cartHeaderMetrics.backIconSize) / 2,
  removeBleed: (TOUCH_TARGET - cartItemMetrics.removeIconSize) / 2,
  tableRowCompactIconSize: 18,
  totalsNoteFontSize: 11,
  totalsNoteLineHeight: 1.5,
} as const;
