'use client';

import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useBoardMovement } from '@/hooks/use-board-movement';
import { isBoardMovementId } from '@/services/board-movement';
import { BoardSessionState, EntrySession, resolveBoardSessionState } from './board-session-state';
import { forgetSession, readEntrySession, rememberSession } from './entry-session';

export type { BoardSessionState, NoTableReason } from './board-session-state';

export type BoardSessionValue = BoardSessionState & {
  /** `status === 'loading'` */
  isLoading: boolean;
  /** `status === 'ready'` — o que a sacola consulta para permitir enviar */
  hasTable: boolean;
  /** Com id, refaz o GET; resolve quando a resposta chega. Sem id, relê URL e storage. */
  retry: () => Promise<void>;
  /** Só a partir de `no-table`: entra em `browsing` até o reload. */
  browseWithoutTable: () => void;
};

const BoardSessionContext = createContext<BoardSessionValue | null>(null);

function holdNoTableWhileRetrying(next: BoardSessionState, previous: BoardSessionState): BoardSessionState {
  const wasNoTable = previous.status === 'no-table' || previous.status === 'browsing';

  return next.status === 'loading' && wasNoTable && next.sessionId !== null && next.sessionId === previous.sessionId
    ? previous
    : next;
}

export function BoardSessionProvider({ children }: PropsWithChildren): React.ReactElement {
  const [entry, setEntry] = useState<EntrySession>(undefined);
  const [isBrowsing, setIsBrowsing] = useState(false);

  useEffect(() => {
    setEntry(readEntrySession());
  }, []);

  const query = useBoardMovement(entry ?? null);
  const { data, error, isError, isFetching, refetch } = query;

  const resolved = useMemo(
    () => resolveBoardSessionState(entry, { data, error, isError, isFetching }, isBrowsing),
    [entry, data, error, isError, isFetching, isBrowsing]
  );

  // refazer o GET de uma mesa "sem mesa" devolve a query a `pending`, e a tela não pode piscar
  const settled = useRef<BoardSessionState>(resolved);
  const state = holdNoTableWhileRetrying(resolved, settled.current);

  useEffect(() => {
    settled.current = state;
  }, [state]);

  const { status } = state;
  const reason = state.reason;

  // grava sempre que a entrada muda, e antes do efeito que esquece: um `?session` fechado ou inexistente
  // sobrescreve a mesa guardada e logo em seguida é removido, em vez de deixar a anterior viva
  useEffect(() => {
    if (entry) {
      rememberSession(entry);
    }
  }, [entry]);

  useEffect(() => {
    if (entry && (reason === 'not-found' || reason === 'closed')) {
      forgetSession(entry);
    }
  }, [entry, reason]);

  const retry = useCallback(async (): Promise<void> => {
    if (isBoardMovementId(entry)) {
      await refetch();
      return;
    }

    setEntry(readEntrySession());
  }, [entry, refetch]);

  const browseWithoutTable = useCallback((): void => {
    if (status === 'no-table') {
      setIsBrowsing(true);
    }
  }, [status]);

  const value = useMemo<BoardSessionValue>(
    () => ({
      ...state,
      isLoading: status === 'loading',
      hasTable: status === 'ready',
      retry,
      browseWithoutTable,
    }),
    [state, status, retry, browseWithoutTable]
  );

  return <BoardSessionContext.Provider value={value}>{children}</BoardSessionContext.Provider>;
}

export function useBoardSession(): BoardSessionValue {
  const value = useContext(BoardSessionContext);

  if (!value) {
    throw new Error('useBoardSession precisa estar dentro de BoardSessionProvider');
  }

  return value;
}
