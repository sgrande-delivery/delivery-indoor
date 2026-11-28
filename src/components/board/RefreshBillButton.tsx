'use client';

import React from 'react';
import { IconButton } from '@/components/ui';
import { useRefreshBoardBill } from '@/hooks/use-refresh-board-bill';
import { boardCopy } from './board-copy';

export interface RefreshBillButtonProps {
  movementId: string;
}

/** Relê a conta (movimentação, itens e pagamentos). É o do cabeçalho do celular e o do card de itens do tablet. */
const RefreshBillButton: React.FC<RefreshBillButtonProps> = ({ movementId }) => {
  const { refresh, isRefreshing } = useRefreshBoardBill(movementId);

  return (
    <IconButton
      icon="refresh"
      variant="neutral"
      aria-label={boardCopy.refresh}
      aria-busy={isRefreshing}
      disabled={isRefreshing}
      onClick={() => {
        void refresh();
      }}
    />
  );
};

export default RefreshBillButton;
