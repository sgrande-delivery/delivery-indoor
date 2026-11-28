import { spacingScale } from '@/theme';
import { roundsMetrics } from '../rounds/rounds-metrics';

// As medidas do `BoardPaymentRow` (bundle.css do DS, `.bpi-pay-row`) e do título do cartão "Pagamentos".
export const paymentsMetrics = {
  // o título é o mesmo do cartão "Itens da mesa"
  titleFontSize: roundsMetrics.titleFontSize,
  titleWeight: roundsMetrics.titleWeight,
  listMarginBlockStart: 4,
  // `.bpi-pay-row { gap: 12px; padding: 10px 0 }`
  rowGap: spacingScale.sm,
  rowPaddingBlock: 10,
  // `.bpi-pay-row__ico { width: 38px; height: 38px; border-radius: 12px }` e `.msr { font-size: 20px }`
  iconBoxSize: 38,
  iconBoxRadius: 12,
  iconSize: 20,
  kindFontSize: 13,
  kindWeight: 700,
  whenFontSize: 11,
  // `.bpi-pay-row__when { margin-top: 1px }`
  whenMarginBlockStart: 1,
  valueFontSize: 13.5,
  valueWeight: 800,
  ruleHeight: 1,
  skeletonRows: 2,
  errorMarginBlockStart: spacingScale.xs,
} as const;
