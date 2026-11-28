'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { moneyFormat } from '@/helpers/numberFormat';
import { fontFamilies, pxToRem, typographyTokens } from '@/theme';
import type { BoardMovementDetail } from '@/types/board-movement';
import { useNow } from '@/hooks/use-now';
import { resolveAmountDue, resolvePaidPercent } from '../bill-amounts';
import { formatBoardClock, parseBoardTimestamp } from '../board-time';
import BillCardShell from './BillCardShell';
import BillProgress from './BillProgress';
import BillStateLabel from './BillStateLabel';
import BillTimeRow from './BillTimeRow';
import { billCardMetrics } from './bill-card-metrics';
import { BillState, describeBillState } from './bill-state';
import { formatElapsed } from './format-duration';

export interface BillCardOpenProps {
  movement: BoardMovementDetail;
  boardNumber: string;
  state: Exclude<BillState, 'paid'>;
  action?: React.ReactNode;
}

const Values = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: `${billCardMetrics.valuesRowGap}px ${billCardMetrics.valuesGap}px`,
  marginBlockStart: billCardMetrics.valuesMarginBlockStart,
});

const Due = styled('div')({
  display: 'flex',
  minInlineSize: 0,
  flexDirection: 'column',
});

const Total = styled('div')({
  display: 'flex',
  minInlineSize: 0,
  marginInlineStart: 'auto',
  flexDirection: 'column',
  alignItems: 'flex-end',
});

const Caption = styled('span')(({ theme }) => ({
  ...typographyTokens.caption,
  color: theme.vars.palette.surface.muted,
}));

const DueValue = styled('span')(({ theme }) => ({
  ...typographyTokens.h1,
  color: theme.vars.palette.surface.ink,
}));

const TotalValue = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.totalFontSize),
  fontWeight: billCardMetrics.totalWeight,
  color: theme.vars.palette.surface.ink,
}));

const PaidLine = styled('div')({
  display: 'flex',
  marginBlockStart: billCardMetrics.paidLineMarginBlockStart,
  alignItems: 'center',
  justifyContent: 'space-between',
});

const PaidAmount = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.paidLineFontSize),
  fontWeight: billCardMetrics.paidLineWeight,
  color: theme.vars.palette.toneOnCard.success,
}));

const PaidPercent = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.paidLineFontSize),
  fontWeight: billCardMetrics.paidLineWeight,
  color: theme.vars.palette.surface.muted,
}));

const ActionSlot = styled('div')({
  marginBlockStart: billCardMetrics.actionMarginBlockStart,
});

const BillCardOpen: React.FC<BillCardOpenProps> = ({ movement, boardNumber, state, action }) => {
  const now = useNow(billCardMetrics.tickMs);
  const percent = resolvePaidPercent(movement);
  const openedAt = parseBoardTimestamp(movement.opened_at);
  const openedClock = formatBoardClock(movement.opened_at, now);

  return (
    <BillCardShell>
      <BillStateLabel>{describeBillState(state, boardNumber)}</BillStateLabel>
      <Values>
        <Due>
          <Caption>Falta pagar</Caption>
          <DueValue>{moneyFormat(resolveAmountDue(movement))}</DueValue>
        </Due>
        <Total>
          <Caption>Total</Caption>
          <TotalValue>{moneyFormat(movement.total_due)}</TotalValue>
        </Total>
      </Values>
      <BillProgress percent={percent} />
      <PaidLine>
        <PaidAmount>{moneyFormat(movement.total_paid)} pagos</PaidAmount>
        <PaidPercent>{percent}%</PaidPercent>
      </PaidLine>
      {action !== undefined && <ActionSlot>{action}</ActionSlot>}
      {openedAt !== null && (
        <BillTimeRow
          label="Mesa ocupada há"
          value={formatElapsed(openedAt, now.getTime())}
          aside={openedClock === null ? null : `desde ${openedClock}`}
        />
      )}
    </BillCardShell>
  );
};

export default BillCardOpen;
