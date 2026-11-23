'use client';

import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import ErrorHomeAction from '@/components/error/ErrorHomeAction';
import InlineError from '@/components/error/InlineError';
import RouteErrorState from '@/components/error/RouteErrorState';
import { Button, EmptyState, useToast } from '@/components/ui';
import { formatClockTime } from '@/helpers/clock-time';
import { useQueryScreenState } from '@/hooks/use-query-screen-state';
import { useIsOffline, useOfflineBannerMessage } from '@/providers/connectivity/ConnectivityProvider';
import { fontFamilies } from '@/theme';
import SandboxSkeleton from './SandboxSkeleton';
import ThrowOnDemand, { THROW_FLAG } from './ThrowOnDemand';
import { useSandboxQuery } from './use-sandbox-query';

const PAY_OFFLINE_NOTE = 'Pagamento pelo app indisponível sem conexão. O garçom fecha a conta no caixa.';
const LOADING_BUTTON_MS = 2000;

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  blockSize: '100%',
  overflowY: 'auto',
  padding: 24,
  fontFamily: fontFamilies.text,
  backgroundColor: theme.vars.palette.surface.page,
  color: theme.vars.palette.surface.ink,
}));

const Section = styled('section')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 12,
});

const Heading = styled('h2')({
  margin: 0,
  fontSize: 16,
});

const Row = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
});

const Note = styled('p')(({ theme }) => ({
  margin: 0,
  fontSize: 12.5,
  color: theme.vars.palette.surface.muted,
}));

const StatesSandbox: React.FC = () => {
  const toast = useToast();
  const isOffline = useIsOffline();
  const { query, reload } = useSandboxQuery();
  const screen = useQueryScreenState(query);
  const [isBusy, setIsBusy] = useState(false);

  useOfflineBannerMessage(
    query.data === undefined ? null : `Esta é a conta de ${formatClockTime(query.dataUpdatedAt)}. (sandbox)`
  );

  function handleBreakRoute(): void {
    sessionStorage.setItem(THROW_FLAG, '1');
    window.location.reload();
  }

  function handleBusy(): void {
    setIsBusy(true);
    window.setTimeout(() => setIsBusy(false), LOADING_BUTTON_MS);
  }

  function handlePartialToast(): void {
    toast.show({
      variant: 'error',
      message: 'Não foi possível chamar o garçom.',
      action: { label: 'Tentar de novo', onClick: handleBusy },
    });
  }

  if (screen.view === 'error') {
    return (
      <>
        <ThrowOnDemand />
        <RouteErrorState
          error={screen.error}
          failureStreak={screen.failureStreak}
          onRetry={screen.retry}
          title="Não conseguimos carregar a conta"
          description="A mesa continua aberta e nada foi perdido. Verifique a conexão e tente de novo — ou chame o garçom, que ele vê a conta no caixa."
          secondaryAction={<ErrorHomeAction tone="secondary" />}
        />
      </>
    );
  }

  return (
    <Root>
      <ThrowOnDemand />
      <Section>
        <Heading>Query real (GET /restaurants)</Heading>
        {screen.view === 'skeleton' ? (
          <SandboxSkeleton />
        ) : (
          <div>
            <strong>{query.data?.name}</strong>
            <Note>{query.data?.is_open ? 'aberto' : 'fechado'}</Note>
          </div>
        )}
        {screen.isRefreshFailed && (
          <InlineError message="Não foi possível atualizar." onRetry={screen.retry} isRetrying={query.isFetching} />
        )}
        <Row>
          <Button variant="neutral" onClick={reload}>
            recarregar
          </Button>
          <Button variant="neutral" onClick={screen.retry}>
            reler sem apagar
          </Button>
          <Button variant="destructive" onClick={handleBreakRoute}>
            quebrar a rota
          </Button>
        </Row>
      </Section>

      <Section>
        <Heading>Vazio</Heading>
        <EmptyState icon="search_off" title="Nenhum produto para mostrar" description="Tente outra categoria." />
        <EmptyState
          variant="compact"
          icon="shopping_bag"
          title="Nenhum item ainda"
          description="Adicione do cardápio."
        />
      </Section>

      <Section>
        <Heading>Erro parcial e ação em curso</Heading>
        <Row>
          <Button variant="neutral" onClick={handlePartialToast}>
            mostrar toast de erro
          </Button>
          <Button loading={isBusy} onClick={handleBusy}>
            enviar
          </Button>
        </Row>
        <InlineError message="Não foi possível carregar as sugestões." onRetry={handleBusy} />
      </Section>

      <Section>
        <Heading>Offline</Heading>
        <Button disabled={isOffline} onClick={handleBusy}>
          Pagar conta
        </Button>
        {isOffline && <Note>{PAY_OFFLINE_NOTE}</Note>}
      </Section>
    </Root>
  );
};

export default StatesSandbox;
