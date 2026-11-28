'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { moneyFormat } from '@/helpers/numberFormat';
import type { BoardMovementDetail } from '@/types/board-movement';
import { resolveAmountDue } from '../bill-amounts';
import { boardMetrics } from '../board-metrics';
import { describeItemCount } from '../board-summary';
import { roundsMetrics } from '../rounds/rounds-metrics';
import BoardTotalsEmphasis from './BoardTotalsEmphasis';
import BoardTotalsRow from './BoardTotalsRow';
import { formatTipLabel, totalsCopy } from './totals-copy';
import { totalsMetrics } from './totals-metrics';

export interface BoardTotalsProps {
  movement: BoardMovementDetail;
  variant?: 'open' | 'paid';
  appearance: 'footer' | 'card';
  /** Só no pago: "Subtotal · {n} itens". */
  itemCount?: number;
  /**
   * As linhas de pagamento do tablet (grupos `dt`/`dd` que só aparecem no tablet). Quando vêm, o celular segue com a
   * linha agregada "Já pago" e o tablet usa estas; sem elas (pagamentos sem dado), a agregada vale nos dois.
   */
  paidRows?: React.ReactNode;
}

const Root = styled('dl', {
  shouldForwardProp: prop => prop !== 'appearance',
})<{ appearance: 'footer' | 'card' }>(({ theme, appearance }) => ({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  ...(appearance === 'footer'
    ? {
        // no cartão de itens que cresce (tablet deitado) o resumo desce para o pé
        marginBlockStart: 'auto',
        paddingBlockStart: totalsMetrics.footerPaddingBlockStart,
        paddingBlockEnd: totalsMetrics.footerPaddingBlockEnd,
        paddingInline: roundsMetrics.cardPaddingInline,
        borderBlockStart: `${totalsMetrics.ruleHeight}px solid ${theme.vars.palette.surface.line}`,
      }
    : {
        flexShrink: 0,
        padding: totalsMetrics.cardPadding,
        borderRadius: boardMetrics.cardRadius,
        boxShadow: boardMetrics.cardShadow,
        backgroundColor: theme.vars.palette.surface.card,
      }),
}));

const BoardTotals: React.FC<BoardTotalsProps> = ({ movement, variant = 'open', appearance, itemCount, paidRows }) => {
  const isPaid = variant === 'paid';
  const subtotalLabel =
    isPaid && itemCount !== undefined
      ? `${totalsCopy.subtotal} · ${describeItemCount(itemCount)}`
      : totalsCopy.subtotal;

  return (
    <Root appearance={appearance}>
      <BoardTotalsRow label={subtotalLabel} value={moneyFormat(movement.subtotal)} />
      {movement.tip_amount > 0 && (
        <BoardTotalsRow label={formatTipLabel(movement.tip_pct)} value={moneyFormat(movement.tip_amount)} />
      )}
      {movement.discount > 0 && (
        <BoardTotalsRow
          label={totalsCopy.discount}
          value={`${totalsCopy.minusSign}${moneyFormat(movement.discount)}`}
          tone="positive"
        />
      )}
      {isPaid ? (
        <BoardTotalsEmphasis label={totalsCopy.totalPaid} value={moneyFormat(movement.total_paid)} tone="success" />
      ) : (
        <>
          <BoardTotalsEmphasis label={totalsCopy.total} value={moneyFormat(movement.total_due)} />
          {paidRows}
          {movement.total_paid > 0 && (
            <BoardTotalsRow
              label={totalsCopy.paid}
              value={`${totalsCopy.minusSign}${moneyFormat(movement.total_paid)}`}
              tone="positive"
              visibleOn={paidRows === undefined ? undefined : 'phone'}
            />
          )}
          <BoardTotalsEmphasis label={totalsCopy.due} value={moneyFormat(resolveAmountDue(movement))} tone="brand" />
        </>
      )}
    </Root>
  );
};

export default BoardTotals;
