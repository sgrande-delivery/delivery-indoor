import { controlSizes, radii, searchFieldMetrics, spacingScale } from '@/theme';

// As métricas da busca que o tema ainda não tem: tokens do tema onde há, e os valores do canvas da mesa onde não há.
export const searchLayoutMetrics = {
  headerPaddingBlockStart: 14,
  headerPaddingBlockEnd: spacingScale.sm,
  headerGap: 12,
  fieldBlockSize: controlSizes.lg.height,
  fieldClearSize: controlSizes.md.height,
  fieldClearOffset: -searchFieldMetrics.paddingInline / 2,
  railPaddingInline: spacingScale.md,
  railGap: spacingScale.xs,
  railPaddingBlockEnd: spacingScale.sm,
  bandMarginInline: spacingScale.md,
  bandMarginBlockEnd: spacingScale.sm,
  bandPaddingBlock: 11,
  bandPaddingInline: 14,
  bandGap: 11,
  bandRadius: radii.sm + 4,
  bandFontSize: 12.5,
  bandLineHeight: 1.45,
  bandIconSize: 20,
} as const;
