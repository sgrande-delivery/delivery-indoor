'use client';

import React, { useState } from 'react';
import { isAxiosError } from 'axios';
import { styled } from '@mui/material/styles';
import { Button, EmptyState } from '@/components/ui';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { useBoardSession } from '@/providers/board-session/BoardSessionProvider';
import { readErrorCode } from '@/services/api-error-interceptor';
import { InvalidBoardMovementResponseError } from '@/services/board-movement';
import { typographyTokens } from '@/theme';

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minBlockSize: '100%',
});

const Code = styled('p')(({ theme }) => ({
  margin: 0,
  ...typographyTokens.body2,
  color: theme.vars.palette.surface.muted,
}));

function formatSupportCode(error: unknown): string {
  if (error instanceof InvalidBoardMovementResponseError) {
    return 'Código erro resposta inválida';
  }

  if (!isAxiosError(error) || !error.response) {
    return 'Código erro de rede';
  }

  const internalCode = readErrorCode(error.response.data);

  return internalCode
    ? `Código erro ${error.response.status} · ${internalCode}`
    : `Código erro ${error.response.status}`;
}

const BoardSessionError: React.FC = () => {
  const { error, retry } = useBoardSession();
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry(): Promise<void> {
    setIsRetrying(true);

    try {
      await retry();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <Root>
      <VisuallyHidden role="alert">Não conseguimos carregar a mesa. {formatSupportCode(error)}</VisuallyHidden>
      <EmptyState
        icon="error"
        title="Não conseguimos carregar a mesa"
        description="Verifique a conexão e tente de novo — ou chame o garçom."
        action={
          <Button loading={isRetrying} onClick={handleRetry}>
            Tentar novamente
          </Button>
        }
      />
      <Code>{formatSupportCode(error)}</Code>
    </Root>
  );
};

export default BoardSessionError;
