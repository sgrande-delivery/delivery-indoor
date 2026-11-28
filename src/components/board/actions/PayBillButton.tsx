'use client';

import React from 'react';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import { Button } from '@/components/ui';
import { moneyFormat } from '@/helpers/numberFormat';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { BOARD_PAYMENT_ROUTE } from '@/routes/app-routes';
import { typographyTokens } from '@/theme';
import type { BoardMovementDetail } from '@/types/board-movement';
import { resolveAmountDue } from '../bill-amounts';
import { attendanceCopy } from './attendance-copy';
import { actionsMetrics } from './actions-metrics';

export interface PayBillButtonProps {
  movement: BoardMovementDetail;
}

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: actionsMetrics.gap,
});

// o filho de conteúdo do `Button` é `inline-flex` e encolhe ao que tem dentro: crescer é o que leva o valor à ponta
const Pay = styled(Button)({
  '& > span:first-of-type': {
    flexGrow: 1,
  },
}) as typeof Button;

const Offline = styled('p')(({ theme }) => ({
  ...typographyTokens.caption,
  margin: 0,
  textAlign: 'center',
  color: theme.vars.palette.surface.muted,
  textWrap: 'pretty',
}));

const Line = styled('span')({
  display: 'flex',
  inlineSize: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
});

/**
 * Leva ao pagamento sem valor na URL: a frente do pagamento o relê no momento de cobrar. Desabilitado ele fica sem
 * `href`, senão o toque navegaria assim mesmo.
 */
const PayBillButton: React.FC<PayBillButtonProps> = ({ movement }) => {
  const isOffline = useIsOffline();
  const amountDue = resolveAmountDue(movement);
  const content = (
    <Line>
      <span>{attendanceCopy.payBill}</span>
      <span>{moneyFormat(amountDue)}</span>
    </Line>
  );

  return (
    <Root>
      {isOffline || amountDue <= 0 ? (
        <Pay variant="primary" size="lg" startIcon="payments" fullWidth disabled>
          {content}
        </Pay>
      ) : (
        <Pay component={Link} href={BOARD_PAYMENT_ROUTE} variant="primary" size="lg" startIcon="payments" fullWidth>
          {content}
        </Pay>
      )}
      {isOffline && <Offline>{attendanceCopy.payOffline}</Offline>}
    </Root>
  );
};

export default PayBillButton;
