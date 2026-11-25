'use client';

import React from 'react';
import RouteErrorState from '@/components/error/RouteErrorState';
import InlineError from '@/components/error/InlineError';

const TITLE = 'Não conseguimos carregar a sacola';
const DESCRIPTION = 'Verifique a conexão e tente de novo — ou chame o garçom.';
const INLINE_MESSAGE = 'Não conseguimos carregar a sacola.';

export interface CartLoadErrorProps {
  form: 'route' | 'inline';
  error: unknown;
  failureStreak: number;
  isRetrying: boolean;
  onRetry: () => void;
}

/**
 * O formato é de quem monta o painel: a tela do celular usa o erro de rota, e a coluna e o painel do tablet falham
 * como um bloco só, com o cardápio ao lado ainda valendo.
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

  return <InlineError message={INLINE_MESSAGE} onRetry={onRetry} isRetrying={isRetrying} />;
};

export default CartLoadError;
