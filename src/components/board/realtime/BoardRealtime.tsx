'use client';

import React from 'react';
import { useBoardRealtime } from './use-board-realtime';

/** Mantém a conta ao vivo em toda rota. Não renderiza nada. */
const BoardRealtime: React.FC = () => {
  useBoardRealtime();

  return null;
};

export default BoardRealtime;
