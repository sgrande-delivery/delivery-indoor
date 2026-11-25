'use client';

import React from 'react';
import RouteErrorState from '@/components/error/RouteErrorState';
import { Button, EmptyState } from '@/components/ui';
import { resolveErrorCode } from '@/services/http-error-code';

const TITLE = 'Não conseguimos carregar a sacola';
const DESCRIPTION = 'Verifique a conexão e tente de novo — ou chame o garçom.';
const RETRY_LABEL = 'Tentar novamente';

export interface CartLoadErrorProps {
  form: 'route' | 'inline';
  error: unknown;
  failureStreak: number;
  isRetrying: boolean;
  onRetry: () => void;
}

/**
 * O formato é de quem monta o painel: a tela do celular usa o erro de rota, e a coluna do tablet, que não é a rota
 * inteira, usa a forma de bloco.
 */
const CartLoadError: React.FC<CartLoadErrorProps> = ({ form, error, failureStreak, isRetrying, onRetry }) => {
  if (form === 'route') {
    return (
      <RouteErrorState
        error={error}
        failureStreak={failureStreak}
        onRetry={onRetry}
        title={TITLE}
        description={DESCRIPTION}
      />
    );
  }

  return (
    <EmptyState
      icon="error"
      title={TITLE}
      description={`${DESCRIPTION} (${resolveErrorCode(error)})`}
      action={
        <Button variant="secondary" size="md" loading={isRetrying} onClick={onRetry}>
          {RETRY_LABEL}
        </Button>
      }
    />
  );
};

export default CartLoadError;
