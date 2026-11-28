import { roundsMetrics } from '../rounds/rounds-metrics';

// O respiro visual entre a régua do card e o texto da primeira e da última linha (artboard).
const FOOTER_BREATH = 15;
// `.bpi-totals__row { padding: 5px 0 }`
const ROW_PADDING_BLOCK = 5;

// As medidas do `BoardTotals` (bundle.css do DS, `.bpi-totals`, e o artboard `Conta · celular · em aberto`) que o tema não tem.
export const totalsMetrics = {
  rowFontSize: 13,
  rowLabelWeight: 400,
  rowValueWeight: 700,
  rowPaddingBlock: ROW_PADDING_BLOCK,
  // entre o rótulo (`dt`) e o valor (`dd`) da mesma linha
  labelValueGap: 10,
  // `.bpi-totals__row--strong { margin-top: 8px; padding-top: 12px }`
  emphasisMarginBlockStart: 8,
  emphasisPaddingBlockStart: 12,
  emphasisLabelFontSize: 13,
  emphasisLabelWeight: 700,
  ruleHeight: 1,
  // a linha já traz o próprio `padding-block`, e o `BoardItemsCard` soma o dele embaixo
  footerPaddingBlockStart: FOOTER_BREATH - ROW_PADDING_BLOCK,
  footerPaddingBlockEnd: FOOTER_BREATH - ROW_PADDING_BLOCK - roundsMetrics.cardPaddingBlockEnd,
  // `.bpi-totals { padding: 16px }`
  cardPadding: 16,
} as const;
