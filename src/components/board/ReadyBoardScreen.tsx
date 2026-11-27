'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import RouteErrorState from '@/components/error/RouteErrorState';
import { tabletLandscapeMediaQuery } from '@/components/shell/shell-metrics';
import ConnectedWaiterCallButton from '@/components/waiter/ConnectedWaiterCallButton';
import { useBoardMovement } from '@/hooks/use-board-movement';
import { useBoardPayments } from '@/hooks/use-board-payments';
import { useBoardProducts } from '@/hooks/use-board-products';
import { useQueryScreenState } from '@/hooks/use-query-screen-state';
import { useRefreshBoardBill } from '@/hooks/use-refresh-board-bill';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { boardCopy } from './board-copy';
import { summarizeBoardProducts } from './board-summary';
import BoardHeader from './BoardHeader';
import BoardScreenSkeleton from './BoardScreenSkeleton';
import RefreshBillButton from './RefreshBillButton';
import BoardActionBar from './actions/BoardActionBar';
import OrderMoreButton from './actions/OrderMoreButton';
import PayBillButton from './actions/PayBillButton';
import RequestBillAction from './actions/RequestBillAction';
import BoardBillCard from './bill-card/BoardBillCard';
import BoardBillAside from './layout/BoardBillAside';
import BoardBillMain from './layout/BoardBillMain';
import BoardBody from './layout/BoardBody';
import BoardPaidClosing from './layout/BoardPaidClosing';
import { LandscapeOnly, NotLandscape, PhoneOnly, TabletOnly } from './layout/format-visibility';
import { layoutMetrics } from './layout/layout-metrics';
import BoardPaymentsCard from './payments/BoardPaymentsCard';
import BoardTotalsPaymentLines from './payments/BoardTotalsPaymentLines';
import OfflineDimmed from './realtime/OfflineDimmed';
import { useBoardOfflineLine } from './realtime/use-board-offline-line';
import BoardItemsCard from './rounds/BoardItemsCard';
import BoardTotals from './totals/BoardTotals';

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100%',
});

// O "Atualizar" da conta paga em pé: sem cartão de itens e sem cabeçalho de celular, ele fica numa linha à direita,
// acima dos pagamentos. É o único caminho para reler a conta com o socket caído (RN-06).
const PaidRefresh = styled('div')({
  display: 'flex',
  justifyContent: 'flex-end',
});

// A faixa do aviso de releitura: no celular e em pé é o primeiro filho da coluna; deitada ocupa a linha `notice` da
// grade, que sem aviso não tem altura.
const Notice = styled(InlineError)({
  [`@media ${tabletLandscapeMediaQuery}`]: {
    gridArea: 'notice',
    marginBlockEnd: layoutMetrics.noticeMarginBlockEnd,
  },
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
  // bloco secundário: a falha dele não derruba a tela, e fica no cartão de pagamentos
  const payments = useBoardPayments(sessionId);
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
        secondaryAction={<ConnectedWaiterCallButton fullWidth size="lg" />}
      />
    );
  }

  // `content` garante o dado, mas o tipo do hook não estreita
  if (products.data === undefined) {
    return <BoardScreenSkeleton />;
  }

  const refreshFailed = screen.isRefreshFailed || (movement.isRefetchError && !isOffline);
  const bill = movement.data;
  const paymentList = payments.data;
  // sem pagamento com dado o tablet não tem o que listar, e a linha agregada "Já pago" vale nos dois formatos
  const paymentLines =
    paymentList !== undefined && paymentList.length > 0 ? (
      <BoardTotalsPaymentLines payments={paymentList} />
    ) : undefined;
  const itemCount = summarizeBoardProducts(products.data.products).itemCount;
  const paymentsCard = <BoardPaymentsCard query={payments} />;

  return (
    <Root>
      <BoardHeader boardNumber={boardNumber} movementId={sessionId} />
      <BoardBody>
        {refreshFailed && (
          <Notice
            message={boardCopy.refreshFailed}
            onRetry={() => {
              void refresh();
            }}
            isRetrying={isRefreshing}
          />
        )}
        {bill !== undefined && bill.is_board_paid && (
          // conta paga: vem de `is_board_paid` do servidor. Deitada, o encerramento à direita e os itens à esquerda;
          // no celular e em pé, o card, os pagamentos e o resumo em coluna, sem itens e sem ações
          <>
            <BoardBillAside
              card={
                <>
                  <NotLandscape>
                    <BoardBillCard movement={bill} boardNumber={boardNumber} />
                  </NotLandscape>
                  <LandscapeOnly>
                    <BoardPaidClosing movement={bill} payments={payments} />
                  </LandscapeOnly>
                </>
              }
            />
            <BoardBillMain>
              <OfflineDimmed>
                <LandscapeOnly>
                  <BoardItemsCard
                    products={products.data.products}
                    closedAt={bill.paid_at}
                    headerAction={<RefreshBillButton movementId={sessionId} />}
                    footer={<BoardTotals movement={bill} variant="paid" appearance="footer" itemCount={itemCount} />}
                  />
                </LandscapeOnly>
                <NotLandscape>
                  <TabletOnly>
                    <PaidRefresh>
                      <RefreshBillButton movementId={sessionId} />
                    </PaidRefresh>
                  </TabletOnly>
                  <BoardPaymentsCard query={payments} tone="ink" />
                  <BoardTotals movement={bill} variant="paid" appearance="card" itemCount={itemCount} />
                </NotLandscape>
              </OfflineDimmed>
            </BoardBillMain>
          </>
        )}
        {bill !== undefined && !bill.is_board_paid && (
          <>
            <BoardBillAside
              card={
                <BoardBillCard
                  movement={bill}
                  boardNumber={boardNumber}
                  action={<RequestBillAction movement={bill} />}
                />
              }
              payment={<PayBillButton movement={bill} />}
              secondary={<OrderMoreButton />}
            />
            <BoardBillMain>
              {/* itens e pagamentos num só esmaecimento e numa só pilha: sem pagamento o cartão some e não deixa vão */}
              <OfflineDimmed>
                <BoardItemsCard
                  products={products.data.products}
                  headerAction={
                    <TabletOnly>
                      <RefreshBillButton movementId={sessionId} />
                    </TabletOnly>
                  }
                  footer={<BoardTotals movement={bill} appearance="footer" paidRows={paymentLines} />}
                />
                <PhoneOnly>{paymentsCard}</PhoneOnly>
              </OfflineDimmed>
            </BoardBillMain>
          </>
        )}
        {bill === undefined && (
          <BoardBillMain>
            <OfflineDimmed>
              <BoardItemsCard products={products.data.products} />
              <PhoneOnly>{paymentsCard}</PhoneOnly>
            </OfflineDimmed>
          </BoardBillMain>
        )}
      </BoardBody>
      {bill !== undefined && !bill.is_board_paid && <BoardActionBar movement={bill} />}
    </Root>
  );
};

export default ReadyBoardScreen;
