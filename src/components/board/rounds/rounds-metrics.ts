import { spacingScale } from '@/theme';

// As medidas do card "Itens da mesa" do artboard `Conta · celular · em aberto`.
export const roundsMetrics = {
  cardPaddingBlockStart: 17,
  cardPaddingBlockEnd: 2,
  cardPaddingInline: 17,
  titleFontSize: 13.5,
  titleWeight: 800,
  countFontSize: 11,
  listMarginBlockStart: 14,
  groupGap: 4,
  headerGap: spacingScale.xs,
  headerFontSize: 10,
  headerWeight: 800,
  headerLetterSpacing: '0.08em',
  ruleHeight: 1,
  itemsPaddingBlock: 12,
  itemGap: 12,
  itemRowGap: spacingScale.sm,
  thumbSize: 44,
  thumbRadius: 12,
  thumbIconSize: 22,
  nameFontSize: 13.5,
  nameWeight: 700,
  metaFontSize: 11,
  compositionFontSize: 11,
  compositionGap: 2,
  compositionMarginBlockStart: 3,
  compositionWeight: 600,
  lineHeight: 1.35,
  priceFontSize: 14,
  priceWeight: 800,
  emptyMarginBlockEnd: 15,
  emptyMarginBlockStart: 14,
} as const;

// As medidas de tablet do item (artboards `Conta · tablet deitado` e `Conta · tablet em pé`): miniatura de 52, nome e
// valor em 15, meta em 12. A composição acompanha a meta, que no artboard é a mesma linha `.it-s`.
export const roundsTabletMetrics = {
  thumbSize: 52,
  thumbRadius: 14,
  nameFontSize: 15,
  metaFontSize: 12,
  compositionFontSize: 12,
  priceFontSize: 15,
  // a linha de título ganha o botão "Atualizar" de 44: o respiro de cima encolhe para o texto não descer
  titlePaddingBlockStartWithAction: 8,
} as const;
