'use client';

import React from 'react';
import { moneyFormat } from '@/helpers/numberFormat';
import type { BoardPayment } from '@/types/board-bill';
import { formatBoardClock } from '../board-time';
import BoardTotalsRow from '../totals/BoardTotalsRow';
import { totalsCopy } from '../totals/totals-copy';
import { describePaymentTitle } from './describe-payment';

export interface BoardTotalsPaymentLineProps {
  payment: BoardPayment;
  now: Date;
}

/** Um pagamento como linha do resumo do tablet: "Pix · Rafael · 20:05" e "− R$ 60,00". */
const BoardTotalsPaymentLine: React.FC<BoardTotalsPaymentLineProps> = ({ payment, now }) => {
  const clock = formatBoardClock(payment.created_at, now);
  const title = describePaymentTitle(payment);

  return (
    <BoardTotalsRow
      label={clock === null ? title : `${title} · ${clock}`}
      value={`${totalsCopy.minusSign}${moneyFormat(payment.value)}`}
      tone="positive"
      visibleOn="tablet"
    />
  );
};

export default BoardTotalsPaymentLine;
