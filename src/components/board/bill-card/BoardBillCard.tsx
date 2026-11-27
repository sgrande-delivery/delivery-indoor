'use client';

import React from 'react';
import type { BoardMovementDetail } from '@/types/board-movement';
import BillCardOpen from './BillCardOpen';
import BillCardPaid from './BillCardPaid';
import { resolveBillState } from './bill-state';

export interface BoardBillCardProps {
  movement: BoardMovementDetail;
  boardNumber: string;
  /** O espaço entre a linha do pago e o rodapé; só a conta em aberto o desenha. */
  action?: React.ReactNode;
}

/**
 * O destaque da conta: o que falta pagar. A variante sai de `is_board_paid`, e o card não oferece liberar a mesa, que
 * é ação do PDV. Só pode ser montado no ramo `ready`: no SSR a sessão está em `loading`, e um contador renderizado no
 * servidor divergiria do cliente na hidratação.
 */
const BoardBillCard: React.FC<BoardBillCardProps> = ({ movement, boardNumber, action }) => {
  const state = resolveBillState(movement);

  if (state === 'paid') {
    return <BillCardPaid movement={movement} />;
  }

  return <BillCardOpen movement={movement} boardNumber={boardNumber} state={state} action={action} />;
};

export default BoardBillCard;
