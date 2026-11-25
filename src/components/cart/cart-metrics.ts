import { cartHeaderMetrics, cartItemMetrics, cartScreenMetrics, controlSizes } from '@/theme';

// O que a sacola da mesa desenha e o tema (que veio do client) não tem. Medidas de `Carrinho-Celular` do canvas da
// mesa; o resto vem de `cartHeaderMetrics`, `cartRowMetrics`, `cartItemMetrics`, `cartSummaryMetrics` e
// `cartScreenMetrics`.
const TOUCH_TARGET = controlSizes.md.height;

export const cartMetrics = {
  touchTarget: TOUCH_TARGET,
  // O glifo do voltar (24) e o da lixeira (18) ficam onde o desenho os põe, e o alvo de 44 sangra para fora deles.
  backBleed: (TOUCH_TARGET - cartHeaderMetrics.backIconSize) / 2,
  removeBleed: (TOUCH_TARGET - cartItemMetrics.removeIconSize) / 2,
  // O "Limpar" do celular é o `clearFontSize` do tema (12); o dos artboards de tablet desenha 13, com 4 de folga na coluna e 8 no painel em pé.
  clearDockFontSize: 13,
  clearColumnPaddingInline: 4,
  clearSheetPaddingInline: 8,
  clearConfirmGap: 10,
  tableRowCompactIconSize: 18,
  totalsNoteFontSize: 11,
  totalsNoteLineHeight: 1.5,
} as const;

/**
 * Como a sacola se veste: a tela do celular (cartões), a coluna do tablet em paisagem e o painel do tablet em pé
 * (linhas com separador, o `.ci` dos artboards de tablet). O painel usa as margens do `Sheet` (18), e não as de 28 do
 * artboard, para a lista alinhar com o cabeçalho e o rodapé que o primitivo desenha.
 */
export type CartVariant = 'screen' | 'column' | 'sheet';

export interface CartLineDimensions {
  thumbSize: number;
  nameFontSize: number;
  compositionFontSize: number;
  totalFontSize: number;
  /** Só o painel de retrato: o total tem coluna própria ao lado do stepper. */
  totalInlineSize?: number;
}

export const cartLineMetrics = {
  paddingBlock: 14,
  gap: cartItemMetrics.gap,
  borderWidth: 1,
  column: { thumbSize: 64, nameFontSize: 14, compositionFontSize: 11.5, totalFontSize: 15 },
  sheet: { thumbSize: 72, nameFontSize: 15, compositionFontSize: 12, totalFontSize: 16, totalInlineSize: 84 },
} as const;

export const cartPanelForms = {
  screen: {
    paddingInline: cartScreenMetrics.paddingInline,
    paddingBlockStart: 0,
    tableMarginBlockEnd: cartScreenMetrics.restaurantMarginBlockEnd,
    listGap: cartScreenMetrics.listGap,
  },
  column: { paddingInline: 22, paddingBlockStart: 4, tableMarginBlockEnd: 0, listGap: 0 },
  // 4 do corpo e 12 antes da linha da mesa, como o artboard; as margens são as de 28 do painel (`cartDockMetrics.sheet`)
  sheet: {
    paddingInline: 28,
    paddingBlockStart: 4 + 12,
    tableMarginBlockEnd: 4,
    listGap: 0,
  },
} as const;

// O total sem cartão, no rodapé da coluna e do painel: o do painel é o `Total do pedido` de 15 e 26 do artboard.
export const cartFlatTotalsMetrics = {
  column: { labelFontSize: 14, valueFontSize: 24 },
  sheet: { labelFontSize: 15, valueFontSize: 26 },
} as const;
