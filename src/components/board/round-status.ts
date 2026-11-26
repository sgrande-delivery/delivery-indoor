import type { BoardRoundStatus } from '@/types/board-bill';

/** `neutral` é `surface.field` com `surface.muted`; os outros três são as chaves de `toneOnCard.badge`. */
export type RoundStatusTone = 'open' | 'approved' | 'neutral' | 'cancelled';

/**
 * O `Record` fechado faz esquecer um estado ser erro de `tsc`, e não uma rodada sem rótulo no meio do fluxo.
 * `sent`, `ready` e `canceled` são derivados: o design só desenha "em preparo" e "entregue".
 */
export const BOARD_ROUND_STATUS_LABEL: Record<BoardRoundStatus, string> = {
  sent: 'enviado',
  preparing: 'em preparo',
  ready: 'pronto',
  delivered: 'entregue',
  canceled: 'cancelado',
};

/** `ready` reusa `approved`: inventar cor para o que o design não desenha seria inventar desenho. */
export const BOARD_ROUND_STATUS_TONE: Record<BoardRoundStatus, RoundStatusTone> = {
  sent: 'open',
  preparing: 'approved',
  ready: 'approved',
  delivered: 'neutral',
  canceled: 'cancelled',
};

// As medidas do selo do artboard `Conta · celular · em aberto`.
export const roundStatusPillMetrics = {
  pillFontSize: 10.5,
  pillWeight: 800,
  pillLetterSpacing: '0.04em',
  pillPaddingBlock: 4,
  pillPaddingInline: 10,
} as const;
