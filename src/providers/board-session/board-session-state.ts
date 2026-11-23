import { isBoardMovementId, isBoardMovementNotFound } from '@/services/board-movement';
import { BoardMovementDetail, OpenBoardMovement } from '@/types/board-movement';

export type NoTableReason = 'missing' | 'not-found' | 'closed';

export type BoardSessionState =
  | { status: 'loading'; sessionId: string | null; movement: null; reason: null; error: null }
  | { status: 'ready'; sessionId: string; movement: OpenBoardMovement; reason: null; error: null }
  | { status: 'no-table'; sessionId: string | null; movement: null; reason: NoTableReason; error: null }
  | { status: 'browsing'; sessionId: string | null; movement: null; reason: NoTableReason; error: null }
  | { status: 'error'; sessionId: string; movement: null; reason: null; error: unknown };

/** `undefined` é o intervalo entre o render do servidor e a leitura da entrada no cliente. */
export type EntrySession = string | null | undefined;

export interface BoardMovementQuerySnapshot {
  data: BoardMovementDetail | undefined;
  error: unknown;
  isError: boolean;
  isFetching: boolean;
}

function isOpen(data: BoardMovementDetail): data is OpenBoardMovement {
  return data.is_open && data.board != null;
}

export function resolveBoardSessionState(
  entry: EntrySession,
  query: BoardMovementQuerySnapshot,
  isBrowsing: boolean
): BoardSessionState {
  const noTable = (reason: NoTableReason): BoardSessionState => ({
    status: isBrowsing ? 'browsing' : 'no-table',
    sessionId: entry ?? null,
    movement: null,
    reason,
    error: null,
  });

  if (entry === undefined) {
    return { status: 'loading', sessionId: null, movement: null, reason: null, error: null };
  }

  if (entry === null) {
    return noTable('missing');
  }

  if (!isBoardMovementId(entry)) {
    return noTable('not-found');
  }

  if (query.data) {
    return isOpen(query.data)
      ? { status: 'ready', sessionId: entry, movement: query.data, reason: null, error: null }
      : noTable('closed');
  }

  if (query.isError && isBoardMovementNotFound(query.error)) {
    return noTable('not-found');
  }

  if (query.isError && !query.isFetching) {
    return { status: 'error', sessionId: entry, movement: null, reason: null, error: query.error };
  }

  return { status: 'loading', sessionId: entry, movement: null, reason: null, error: null };
}
