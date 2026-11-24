import { componentRadii, elevations, fontWeights } from '@/theme';

// O que o tema não tem do card de grade da mesa (canvas "Cardápio · tablet deitado/em pé"). O base é a paisagem; o
// retrato sobrescreve por `tabletPortraitShellMediaQuery`.
export const productGridMetrics = {
  radius: componentRadii.paper,
  shadow: elevations.sm,
  gap: 16,
  columns: { landscape: 3, portrait: 2 },
  gutter: { landscape: 24, portrait: 22 },
  nameWeight: fontWeights.bold,
  descriptionLines: 2,
  textLineHeight: 1.4,
  cardBodyGap: 4,
  skeletonPaddingBlockEnd: 14,
  skeletonPaddingInline: 14,
  emptyPadding: '0 90px 40px',
  searchChipBorderWidth: 1.5,
  landscape: {
    mediaHeight: 128,
    bodyPadding: '12px 14px 14px',
    nameFontSize: 14.5,
    descriptionFontSize: 11.5,
    descriptionHeight: 32,
    priceMarginBlockStart: 6,
    priceFontSize: 16,
    placeholderIconSize: 44,
  },
  portrait: {
    mediaHeight: 150,
    bodyPadding: '13px 15px 15px',
    nameFontSize: 15,
    descriptionFontSize: 12,
    descriptionHeight: 34,
    priceMarginBlockStart: 8,
    priceFontSize: 17,
    placeholderIconSize: 48,
  },
  hitIconSize: 15,
  hitFontSize: 11.5,
  hitGap: 5,
  skeletonCards: 6,
  searchChipIconSize: 20,
} as const;
