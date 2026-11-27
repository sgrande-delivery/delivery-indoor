'use client';

import React from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import { Skeleton } from '@/components/ui';
import { useNow } from '@/hooks/use-now';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { fontFamilies, pxToRem } from '@/theme';
import type { BoardPayment } from '@/types/board-bill';
import { boardMetrics } from '../board-metrics';
import BoardPaymentList from './BoardPaymentList';
import type { BoardPaymentTone } from './BoardPaymentRow';
import { sortPaymentsByTime } from './describe-payment';
import { paymentsCopy } from './payments-copy';
import { paymentsMetrics } from './payments-metrics';

export interface BoardPaymentsCardProps {
  query: UseQueryResult<BoardPayment[]>;
  /** Aberta: o verde do cartão. Paga: tinta. */
  tone?: BoardPaymentTone;
}

const NOW_INTERVAL_MS = 60000;

const Root = styled('section')(({ theme }) => ({
  flexShrink: 0,
  padding: boardMetrics.cardPadding,
  borderRadius: boardMetrics.cardRadius,
  boxShadow: boardMetrics.cardShadow,
  backgroundColor: theme.vars.palette.surface.card,
}));

const Title = styled('h2')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(paymentsMetrics.titleFontSize),
  fontWeight: paymentsMetrics.titleWeight,
  color: theme.vars.palette.surface.ink,
}));

// a forma da lista real: a caixa do ícone, com o padding das linhas entre elas, para a troca não empurrar o resumo
const SkeletonRows = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: paymentsMetrics.rowPaddingBlock * 2,
  marginBlockStart: paymentsMetrics.listMarginBlockStart + paymentsMetrics.rowPaddingBlock,
});

const ErrorSlot = styled('div')({
  marginBlockStart: paymentsMetrics.errorMarginBlockStart,
});

const SKELETON_ROWS = Array.from({ length: paymentsMetrics.skeletonRows }, (_, index) => index);

/**
 * Os pagamentos lançados, pelo PDV ou pelo app. Sem pagamento o cartão não existe: na conta aberta o card de destaque
 * já diz "R$ 0,00 pagos", e na paga sem pagamento (um desconto que zera o total) não há o que listar. A falha só daqui
 * fica no bloco: o resto da conta continua.
 */
const BoardPaymentsCard: React.FC<BoardPaymentsCardProps> = ({ query, tone = 'success' }) => {
  const isOffline = useIsOffline();
  const payments = query.data;
  const now = useNow(NOW_INTERVAL_MS, payments !== undefined && payments.length > 0);

  if (payments === undefined) {
    if (query.isError) {
      return (
        <Root>
          <Title>{paymentsCopy.title}</Title>
          <ErrorSlot>
            <InlineError
              message={paymentsCopy.loadFailed}
              onRetry={() => {
                void query.refetch();
              }}
              isRetrying={query.isFetching}
            />
          </ErrorSlot>
        </Root>
      );
    }

    if (query.isPending && query.fetchStatus !== 'idle') {
      return (
        <Root aria-busy="true">
          <Title>{paymentsCopy.title}</Title>
          <SkeletonRows>
            {SKELETON_ROWS.map(row => (
              <Skeleton key={row} width="100%" height={paymentsMetrics.iconBoxSize} />
            ))}
          </SkeletonRows>
        </Root>
      );
    }

    return null;
  }

  if (payments.length === 0) {
    return null;
  }

  return (
    <Root>
      <Title>{paymentsCopy.title}</Title>
      <BoardPaymentList payments={sortPaymentsByTime(payments)} now={now} tone={tone} />
      {query.isRefetchError && !isOffline && (
        <ErrorSlot>
          <InlineError
            message={paymentsCopy.loadFailed}
            onRetry={() => {
              void query.refetch();
            }}
            isRetrying={query.isFetching}
          />
        </ErrorSlot>
      )}
    </Root>
  );
};

export default BoardPaymentsCard;
