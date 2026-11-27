'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { moneyFormat } from '@/helpers/numberFormat';
import { fontFamilies, typographyTokens } from '@/theme';
import type { BoardMovementDetail } from '@/types/board-movement';
import { formatBoardClock, parseBoardTimestamp } from '../board-time';
import BillCardShell from './BillCardShell';
import BillProgress from './BillProgress';
import BillTimeRow from './BillTimeRow';
import { billCardMetrics } from './bill-card-metrics';
import { describeBillState } from './bill-state';
import { formatElapsed } from './format-duration';

export interface BillCardPaidProps {
  movement: BoardMovementDetail;
}

const Heading = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: billCardMetrics.stateGap,
  fontFamily: fontFamilies.text,
  fontSize: typographyTokens.label.fontSize,
  fontWeight: billCardMetrics.stateFontWeight,
  letterSpacing: billCardMetrics.stateLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.toneOnCard.success,
}));

const PaidValue = styled('span')(({ theme }) => ({
  marginBlockStart: billCardMetrics.valuesMarginBlockStart,
  ...typographyTokens.h1,
  color: theme.vars.palette.surface.ink,
}));

const ThanksLine = styled('p')(({ theme }) => ({
  ...typographyTokens.body2,
  margin: 0,
  marginBlockStart: billCardMetrics.thanksMarginBlockStart,
  color: theme.vars.palette.surface.muted,
}));

const BillCardPaid: React.FC<BillCardPaidProps> = ({ movement }) => {
  const openedAt = parseBoardTimestamp(movement.opened_at);
  const paidAt = parseBoardTimestamp(movement.paid_at);
  const now = new Date();
  const openedClock = formatBoardClock(movement.opened_at, now);
  const paidClock = formatBoardClock(movement.paid_at, now);

  return (
    <BillCardShell paid>
      <Heading>
        <Icon name="check_circle" fill size={billCardMetrics.paidIconSize} />
        {describeBillState('paid')}
      </Heading>
      <PaidValue>{moneyFormat(movement.total_paid)}</PaidValue>
      <ThanksLine>Tudo certo. Obrigado pela visita!</ThanksLine>
      <BillProgress percent={100} tone="success" />
      {openedAt !== null && paidAt !== null && (
        <BillTimeRow
          label="Tempo de mesa"
          value={formatElapsed(openedAt, paidAt)}
          aside={openedClock !== null && paidClock !== null ? `${openedClock} – ${paidClock}` : null}
        />
      )}
    </BillCardShell>
  );
};

export default BillCardPaid;
