import { spacingScale } from '@/theme';

// As medidas dos artboards `Conta · tablet deitado`, `Conta · tablet em pé` e `Conta · tablet deitado · conta paga`
// que o tema não tem. Raio, sombra e padding de cartão vêm de `boardMetrics`; fonte vem dos tokens do tema.
export const layoutMetrics = {
  // `grid-template-columns: minmax(0,1fr) 440px; gap: 22px; padding: 22px 28px`
  landscapeAsideWidth: 440,
  landscapeGap: 22,
  landscapePaddingBlock: 22,
  landscapePaddingInline: 28,
  // a coluna direita: o card, o lugar do pagamento e "Pedir mais" (`gap: 14px`)
  asideGap: 14,
  // o corpo em pé: `padding: 22px 24px; gap: 16px`
  portraitPaddingBlock: 22,
  portraitPaddingInline: 24,
  portraitGap: 16,
  // a sombra do cartão (`elevations.sm`: 0 6px 16px) sangra para fora da região que rola; o respiro dentro da região
  // impede o corte, e a margem negativa devolve o cartão ao lugar da grade
  shadowBleedInline: 11,
  shadowBleedBlockStart: 10,
  shadowBleedBlockEnd: 22,
  noticeMarginBlockEnd: spacingScale.sm,
  // o encerramento: `padding: 28px 24px; gap: 14px`, círculo de 84, glifo de 44
  closingPaddingBlock: 28,
  closingPaddingInline: 24,
  closingGap: 14,
  closingTileSize: 84,
  closingTileIconSize: 44,
  closingHeadingMarginBlockStart: 4,
  closingListGap: 9,
  closingListMarginBlockStart: spacingScale.xs,
  // os botões "Garçom" e "Pedir mais" da barra em pé, no esqueleto: a largura do conteúdo, que ainda não existe
  skeletonBarButtonWidth: 132,
  closingLineHeight: 1.6,
  closingNoteLineHeight: 1.5,
} as const;
