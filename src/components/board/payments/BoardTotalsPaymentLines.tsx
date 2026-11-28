'use client';

import React from 'react';
import { useNow } from '@/hooks/use-now';
import type { BoardPayment } from '@/types/board-bill';
import BoardTotalsPaymentLine from './BoardTotalsPaymentLine';
import { sortPaymentsByTime } from './describe-payment';

const NOW_INTERVAL_MS = 60000;

export interface BoardTotalsPaymentLinesProps {
  payments: readonly BoardPayment[];
}

/**
 * Os pagamentos como linhas do resumo do tablet: "Pix · Rafael · 20:05  − R$ 60,00", em ordem de hora. Cada linha é um
 * grupo `dt`/`dd` do `dl` do `BoardTotals`, e só aparece no tablet: o celular tem o cartão "Pagamentos" e a linha
 * agregada. Quem monta decide se há o que listar (`paidRows` fica de fora sem dado), para a agregada não sumir.
 */
const BoardTotalsPaymentLines: React.FC<BoardTotalsPaymentLinesProps> = ({ payments }) => {
  const now = useNow(NOW_INTERVAL_MS);

  return (
    <>
      {sortPaymentsByTime(payments).map(payment => (
        <BoardTotalsPaymentLine key={payment.id} payment={payment} now={now} />
      ))}
    </>
  );
};

export default BoardTotalsPaymentLines;
