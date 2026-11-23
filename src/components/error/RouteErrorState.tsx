'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import Overlay from '@/components/ui/Overlay';
import { resolveErrorCode } from '@/services/http-error-code';
import ErrorPage from './ErrorPage';
import ErrorPagePrimaryAction from './ErrorPagePrimaryAction';
import RouteErrorPanel from './RouteErrorPanel';
import { INSTABILITY_DESCRIPTION, INSTABILITY_THRESHOLD } from './route-error-copy';
import { SERVER_ERROR_RETRY_LABEL } from './server-error-copy';
import { ErrorReportSource, useErrorReport } from './use-error-report';

export interface RouteErrorStateProps {
  error: unknown;
  failureStreak: number;
  onRetry: () => void;
  title: string;
  description: string;
  secondaryAction?: React.ReactNode;
  /** `route-query` é o padrão; o `app/error.tsx` passa `next-error-boundary`. */
  reportSource?: ErrorReportSource;
}

// O erro de rota não fecha: o consumidor da folha e do painel recebe um `onClose` que não faz nada, e o backdrop, o
// `Esc` e o arrasto resolvem para ele (o `Sheet` devolve a folha ao lugar quando o consumidor não fecha).
function keepOpen(): void {
  return undefined;
}

const PhoneForm = styled('div')({
  blockSize: '100%',
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'none',
  },
});

/**
 * O único lugar que decide a forma do erro de rota. A tela passa copy e ação, nunca o formato:
 * fora do shell de tablet é a `ErrorPage` cheia; com ele, a `Overlay`, que já escolhe `Sheet` ou painel centrado
 * no `overlayBreakpoint`. A forma de celular é escondida por CSS, e não por `useMediaQuery`, para o primeiro
 * paint no tablet não piscar a tela cheia. A `Overlay` monta por `useMediaQuery` porque é portal com foco preso.
 */
const RouteErrorState: React.FC<RouteErrorStateProps> = props => {
  const { error, failureStreak, onRetry, title, description, secondaryAction, reportSource = 'route-query' } = props;
  const isTabletShell = useMediaQuery(tabletShellMediaQuery);
  const code = resolveErrorCode(error);
  const reference = useErrorReport(error, reportSource);
  const resolvedDescription = failureStreak >= INSTABILITY_THRESHOLD ? INSTABILITY_DESCRIPTION : description;

  return (
    <>
      <PhoneForm>
        <ErrorPage
          variant="server-error"
          title={title}
          description={resolvedDescription}
          code={code}
          reference={reference}
          actions={
            <>
              <ErrorPagePrimaryAction startIcon="refresh" onClick={onRetry}>
                {SERVER_ERROR_RETRY_LABEL}
              </ErrorPagePrimaryAction>
              {secondaryAction}
            </>
          }
        />
      </PhoneForm>
      {isTabletShell && (
        <Overlay open onClose={keepOpen} aria-label={title}>
          <RouteErrorPanel
            title={title}
            description={resolvedDescription}
            code={code}
            reference={reference}
            onRetry={onRetry}
            secondaryAction={secondaryAction}
          />
        </Overlay>
      )}
    </>
  );
};

export default RouteErrorState;
