import type { ReactElement } from 'react';
import ErrorHomeAction from '@/components/error/ErrorHomeAction';
import ErrorPage from '@/components/error/ErrorPage';

const TITLE = 'Página não encontrada';
const DESCRIPTION = 'O endereço pode ter mudado ou o item saiu do cardápio. Que tal voltar e escolher outra coisa?';

export default function NotFound(): ReactElement {
  return (
    <ErrorPage
      variant="not-found"
      title={TITLE}
      description={DESCRIPTION}
      actions={<ErrorHomeAction tone="primary" />}
    />
  );
}
