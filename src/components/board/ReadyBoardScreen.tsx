'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import RouteErrorState from '@/components/error/RouteErrorState';
import { useBoardMovement } from '@/hooks/use-board-movement';
import { useBoardPayments } from '@/hooks/use-board-payments';
import { useBoardProducts } from '@/hooks/use-board-products';
import { useQueryScreenState } from '@/hooks/use-query-screen-state';
import { useRefreshBoardBill } from '@/hooks/use-refresh-board-bill';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { boardCopy } from './board-copy';
import { boardMetrics } from './board-metrics';
import BoardHeader from './BoardHeader';
import BoardScreenSkeleton from './BoardScreenSkeleton';
import BoardBillCard from './bill-card/BoardBillCard';
import OfflineDimmed from './realtime/OfflineDimmed';
import { useBoardOfflineLine } from './realtime/use-board-offline-line';
import BoardItemsCard from './rounds/BoardItemsCard';
import BoardTotals from './totals/BoardTotals';

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100%',
});

const Body = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  gap: boardMetrics.gap,
  paddingBlockStart: boardMetrics.bodyPaddingBlockStart,
  paddingBlockEnd: boardMetrics.bodyPaddingBlockEnd,
  paddingInline: boardMetrics.paddingInline,
});

interface ReadyBoardScreenProps {
  sessionId: string;
  boardNumber: string;
}

const ReadyBoardScreen: React.FC<ReadyBoardScreenProps> = ({ sessionId, boardNumber }) => {
  const isOffline = useIsOffline();
  const products = useBoardProducts(sessionId);
  // segundo observador da chave do provider: relê ao montar (`staleTime` 0), junto com itens e pagamentos,
  // para o "falta pagar" não vir de uma movimentação mais velha que a lista
  const movement = useBoardMovement(sessionId);
  // bloco secundário: a falha dele não derruba a tela, e a leitura aqui aquece o cache para o bloco de pagamentos
  useBoardPayments(sessionId);
  const { refresh, isRefreshing } = useRefreshBoardBill(sessionId);
  const screen = useQueryScreenState(products);
  useBoardOfflineLine(products);

  if (screen.view === 'skeleton') {
    return <BoardScreenSkeleton />;
  }

  if (screen.view === 'error') {
    return (
      <RouteErrorState
        error={screen.error}
        failureStreak={screen.failureStreak}
        onRetry={screen.retry}
        title={boardCopy.errorTitle}
        description={boardCopy.errorDescription}
      />
    );
  }

  // `content` garante o dado, mas o tipo do hook não estreita
  if (products.data === undefined) {
    return <BoardScreenSkeleton />;
  }

  const refreshFailed = screen.isRefreshFailed || (movement.isRefetchError && !isOffline);

  return (
    <Root>
      <BoardHeader
        boardNumber={boardNumber}
        onRefresh={() => {
          void refresh();
        }}
        isRefreshing={isRefreshing}
      />
      <Body>
        {refreshFailed && (
          <InlineError
            message={boardCopy.refreshFailed}
            onRetry={() => {
              void refresh();
            }}
            isRetrying={isRefreshing}
          />
        )}
        {movement.data !== undefined && <BoardBillCard movement={movement.data} boardNumber={boardNumber} />}
        <OfflineDimmed>
          <BoardItemsCard
            products={products.data.products}
            footer={movement.data !== undefined && <BoardTotals movement={movement.data} appearance="footer" />}
          />
        </OfflineDimmed>
      </Body>
    </Root>
  );
};

export default ReadyBoardScreen;
