'use client';

import { useCallback } from 'react';
import { useBoardSession } from '@/providers/board-session';
import { clearStoredCart } from '@/services/cart';
import { resetSendState } from './send-store';

/**
 * O caminho de quem tem a mesa fechada: a sacola pertence a uma movimentação que não recebe mais pedido, então ela e a
 * falha guardada saem, e a mesa é relida. O gate vê a movimentação fechada e troca a rota por "Leia o QR code da mesa".
 */
export function useReadTableQr(): () => void {
  const session = useBoardSession();

  const { retry } = session;

  return useCallback(() => {
    clearStoredCart();
    resetSendState();
    void retry();
  }, [retry]);
}
