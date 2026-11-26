'use client';

import React from 'react';
import { EmptyState } from '@/components/ui';

const TITLE = 'Seu pedido pode já ter saído';
const DESCRIPTION =
  'A conexão falhou no meio do envio. Toque em tentar novamente: se ele já entrou, você o vê na conta da mesa, sem pedir duas vezes.';

/** No lugar do vazio: a sacola sumiu porque o pedido pode ter entrado, e o aviso de falha com o retry está no rodapé. */
const CartSendPending: React.FC = () => {
  return <EmptyState icon="schedule" title={TITLE} description={DESCRIPTION} />;
};

export default CartSendPending;
