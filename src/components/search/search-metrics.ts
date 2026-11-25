import { phoneGutter } from '@/components/menu/tablet-gutter';
import { controlSizes, radii, searchFieldMetrics, spacingScale } from '@/theme';

// As métricas da busca que o tema ainda não tem: tokens do tema onde há, e os valores do canvas da mesa onde não há.
export const searchLayoutMetrics = {
  headerPaddingBlockStart: 14,
  // A entrada do tablet não tem artboard: as colunas seguem a grade de produtos (3 deitado, 2 em pé) com uma a mais,
  // porque o atalho de categoria é só o nome.
  entryGridColumnsLandscape: 4,
  entryGridColumnsPortrait: 3,
  headerPaddingBlockEnd: spacingScale.sm,
  headerGap: 12,
  fieldBlockSize: controlSizes.lg.height,
  fieldClearSize: controlSizes.md.height,
  fieldClearOffset: -searchFieldMetrics.paddingInline / 2,
  railPaddingInline: phoneGutter,
  railGap: spacingScale.xs,
  railPaddingBlockEnd: spacingScale.sm,
  bandMarginInline: phoneGutter,
  bandMarginBlockEnd: spacingScale.sm,
  bandPaddingBlock: 11,
  bandPaddingInline: 14,
  bandGap: 11,
  bandRadius: radii.sm + 4,
  bandFontSize: 12.5,
  bandLineHeight: 1.45,
  bandIconSize: 20,
} as const;
