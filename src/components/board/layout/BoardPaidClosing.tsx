'use client';

import React from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import { Icon } from '@/components/ui';
import ConnectedWaiterCallButton from '@/components/waiter/ConnectedWaiterCallButton';
import { moneyFormat } from '@/helpers/numberFormat';
import { useNow } from '@/hooks/use-now';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { typographyTokens } from '@/theme';
import type { BoardPayment } from '@/types/board-bill';
import type { BoardMovementDetail } from '@/types/board-movement';
import { boardMetrics } from '../board-metrics';
import BoardPaymentList from '../payments/BoardPaymentList';
import { sortPaymentsByTime } from '../payments/describe-payment';
import { paymentsCopy } from '../payments/payments-copy';
import { closingCopy } from './closing-copy';
import { layoutMetrics } from './layout-metrics';

export interface BoardPaidClosingProps {
  movement: Pick<BoardMovementDetail, 'total_paid'>;
  payments: UseQueryResult<BoardPayment[]>;
}

const NOW_INTERVAL_MS = 60000;

// Quem monta o põe em `LandscapeOnly`: no celular e em pé a conta paga é o card do topo e os cartões em coluna.
const Root = styled('section')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  flexGrow: 1,
  alignItems: 'center',
  gap: layoutMetrics.closingGap,
  paddingBlock: layoutMetrics.closingPaddingBlock,
  paddingInline: layoutMetrics.closingPaddingInline,
  textAlign: 'center',
  borderRadius: boardMetrics.cardRadius,
  boxShadow: boardMetrics.cardShadow,
  backgroundColor: theme.vars.palette.surface.card,
}));

const Tile = styled('span')(({ theme }) => ({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: layoutMetrics.closingTileSize,
  blockSize: layoutMetrics.closingTileSize,
  borderRadius: '50%',
  backgroundColor: theme.vars.palette.toneOnCard.paidTile.backgroundColor,
  color: theme.vars.palette.toneOnCard.paidTile.color,
}));

const Heading = styled('h2')(({ theme }) => ({
  ...typographyTokens.h2,
  margin: 0,
  marginBlockStart: layoutMetrics.closingHeadingMarginBlockStart,
  color: theme.vars.palette.surface.ink,
}));

const Summary = styled('p')(({ theme }) => ({
  ...typographyTokens.body1,
  margin: 0,
  lineHeight: layoutMetrics.closingLineHeight,
  color: theme.vars.palette.surface.muted,
  textWrap: 'pretty',
}));

const Payments = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'stretch',
  gap: layoutMetrics.closingListGap,
  marginBlockStart: layoutMetrics.closingListMarginBlockStart,
  textAlign: 'start',
});

const PaymentsLabel = styled('h3')(({ theme }) => ({
  ...typographyTokens.label,
  margin: 0,
  color: theme.vars.palette.surface.muted,
}));

const Waiter = styled('div')({
  display: 'flex',
  alignSelf: 'stretch',
  marginBlockStart: 'auto',
});

const Note = styled('p')(({ theme }) => ({
  ...typographyTokens.caption,
  margin: 0,
  lineHeight: layoutMetrics.closingNoteLineHeight,
  color: theme.vars.palette.surface.muted,
}));

/**
 * O encerramento da conta no tablet deitado, no lugar do card e do pagamento: "Conta paga", o total quitado, os
 * pagamentos e o garçom. Nada de pagar: a conta está quitada, e liberar a mesa é do PDV, então a frase não oferece
 * isso nem promete que o garçom foi avisado.
 */
const BoardPaidClosing: React.FC<BoardPaidClosingProps> = ({ movement, payments }) => {
  const isOffline = useIsOffline();
  const list = payments.data;
  const now = useNow(NOW_INTERVAL_MS, list !== undefined && list.length > 0);

  return (
    <Root>
      <Tile>
        <Icon name="check_circle" fill size={layoutMetrics.closingTileIconSize} />
      </Tile>
      <Heading>{closingCopy.title}</Heading>
      <Summary>{closingCopy.summary(moneyFormat(movement.total_paid))}</Summary>
      {list !== undefined && list.length > 0 && (
        <Payments>
          <PaymentsLabel>{paymentsCopy.title}</PaymentsLabel>
          <BoardPaymentList payments={sortPaymentsByTime(list)} now={now} tone="success" meta="confirmed" />
        </Payments>
      )}
      {list === undefined && payments.isError && !isOffline && (
        <InlineError
          message={paymentsCopy.loadFailed}
          onRetry={() => {
            void payments.refetch();
          }}
          isRetrying={payments.isFetching}
        />
      )}
      <Waiter>
        <ConnectedWaiterCallButton fullWidth />
      </Waiter>
      <Note>{closingCopy.invoiceNote}</Note>
    </Root>
  );
};

export default BoardPaidClosing;
