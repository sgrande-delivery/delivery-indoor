import { componentRadii, spacingScale } from '@/theme';

// As medidas do artboard `Conta · celular · em aberto` que o tema ainda não tem.
export const boardMetrics = {
  headerPaddingBlockStart: spacingScale.xs,
  headerPaddingBlockEnd: spacingScale.sm,
  headerGap: 10,
  bodyPaddingBlockStart: 2,
  bodyPaddingBlockEnd: 18,
  paddingInline: 18,
  gap: spacingScale.sm,
  cardRadius: componentRadii.paper,
  cardPadding: 18,
} as const;

// A forma dos blocos do artboard, para o skeleton ter a altura do que substitui.
export const boardSkeletonMetrics = {
  heroChip: { width: 150, height: 14 },
  heroValue: { width: 160, height: 36 },
  heroBar: { height: 6 },
  heroFooter: { width: 120, height: 14 },
  itemsTitle: { width: 110, height: 16 },
  roundHeader: { width: 150, height: 16 },
  headerTitle: { width: 140, height: 36 },
  roundBadgeWidth: 72,
  itemThumbRadius: 12,
  itemRowHeight: 44,
  itemRows: 3,
  paymentRowHeight: 40,
} as const;
