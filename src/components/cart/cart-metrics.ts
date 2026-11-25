import { cartHeaderMetrics, cartItemMetrics, controlSizes, stepperSizes } from '@/theme';

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
  // O item do esqueleto acompanha o stepper `md` da linha (o do tema dimensiona com o `xs`).
  skeletonItemBlockSize: Math.round(
    cartItemMetrics.padding * 2 +
      cartItemMetrics.nameFontSize * cartItemMetrics.nameLineHeight +
      cartItemMetrics.compositionMarginBlockStart +
      cartItemMetrics.compositionFontSize * cartItemMetrics.compositionLineHeight +
      cartItemMetrics.compositionMarginBlockEnd +
      stepperSizes.md.height
  ),
} as const;
