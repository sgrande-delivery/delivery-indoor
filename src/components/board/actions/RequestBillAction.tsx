'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Button, Icon } from '@/components/ui';
import { useRequestBill } from '@/hooks/use-request-bill';
import { typographyTokens } from '@/theme';
import type { BoardMovementDetail } from '@/types/board-movement';
import { formatBoardClock } from '../board-time';
import { actionsMetrics } from './actions-metrics';
import { attendanceCopy } from './attendance-copy';

export interface RequestBillActionProps {
  movement: BoardMovementDetail;
}

const Requested = styled('p')(({ theme }) => ({
  ...typographyTokens.body2,
  display: 'flex',
  alignItems: 'center',
  gap: actionsMetrics.requestedGap,
  margin: 0,
  color: theme.vars.palette.surface.muted,
}));

/** O pedido de conta é botão próprio e não consequência de pagar: quem paga na maquininha também o usa. */
const RequestBillAction: React.FC<RequestBillActionProps> = ({ movement }) => {
  const { state, requestedAt, request } = useRequestBill();

  if (movement.is_board_paid) {
    return null;
  }

  if (state === 'requested') {
    const clock = formatBoardClock(requestedAt, new Date());

    return (
      <Requested role="status">
        <Icon name="receipt_long" size={actionsMetrics.requestedIconSize} />
        {clock === null ? attendanceCopy.requestBill : attendanceCopy.billRequested(clock)}
      </Requested>
    );
  }

  return (
    <Button
      variant="neutral"
      size="md"
      startIcon="receipt_long"
      fullWidth
      loading={state === 'pending'}
      disabled={state === 'unavailable'}
      onClick={request}
    >
      {attendanceCopy.requestBill}
    </Button>
  );
};

export default RequestBillAction;
