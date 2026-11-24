'use client';

import React from 'react';
import Link from 'next/link';
import ErrorPagePrimaryAction from './ErrorPagePrimaryAction';
import ErrorPageSecondaryAction from './ErrorPageSecondaryAction';
import { SERVER_ERROR_HOME_LABEL } from './server-error-copy';

export interface ErrorHomeActionProps {
  tone: 'primary' | 'secondary';
}

/**
 * O link de volta é `/`, sem `?session=`: a mesa vive no provider da sessão (memória e `sessionStorage`), e a
 * navegação interna a mantém.
 */
const ErrorHomeAction: React.FC<ErrorHomeActionProps> = ({ tone }) => {
  if (tone === 'primary') {
    return (
      <ErrorPagePrimaryAction component={Link} href="/">
        {SERVER_ERROR_HOME_LABEL}
      </ErrorPagePrimaryAction>
    );
  }

  return (
    <ErrorPageSecondaryAction component={Link} href="/">
      {SERVER_ERROR_HOME_LABEL}
    </ErrorPageSecondaryAction>
  );
};

export default ErrorHomeAction;
