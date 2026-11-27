'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import type { BoardPayment } from '@/types/board-bill';
import BoardPaymentRow, { type BoardPaymentTone } from './BoardPaymentRow';
import { paymentsMetrics } from './payments-metrics';

export interface BoardPaymentListProps {
  payments: readonly BoardPayment[];
  now: Date;
  tone: BoardPaymentTone;
}

const Root = styled('ul')({
  listStyle: 'none',
  margin: 0,
  marginBlockStart: paymentsMetrics.listMarginBlockStart,
  padding: 0,
});

const BoardPaymentList: React.FC<BoardPaymentListProps> = ({ payments, now, tone }) => (
  <Root>
    {payments.map(payment => (
      <BoardPaymentRow key={payment.id} payment={payment} now={now} tone={tone} />
    ))}
  </Root>
);

export default BoardPaymentList;
