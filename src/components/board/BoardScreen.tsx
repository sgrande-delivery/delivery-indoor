'use client';

import React from 'react';
import { useBoardSession } from '@/providers/board-session/BoardSessionProvider';
import BoardScreenSkeleton from './BoardScreenSkeleton';
import ReadyBoardScreen from './ReadyBoardScreen';

/**
 * A conta da mesa. Não lê rota: a mesa vem do `useBoardSession()`, e a tela também é montada pela frente do
 * pagamento. O portão da sessão só deixa chegar `loading` e `ready`; fora de `ready` não há mesa para ler.
 */
const BoardScreen: React.FC = () => {
  const session = useBoardSession();

  if (session.status !== 'ready') {
    return <BoardScreenSkeleton />;
  }

  return <ReadyBoardScreen sessionId={session.sessionId} boardNumber={session.movement.board.number} />;
};

export default BoardScreen;
