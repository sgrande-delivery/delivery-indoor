import type { BoardWaiterCall } from '@/types/board-movement';
import { parseBoardTimestamp } from '../board-time';

/** O fim da janela de idempotência, em ms. A janela é `window_seconds` do contrato: o app não a fixa. */
export function resolveWaiterCallEnd(call: BoardWaiterCall | null): number | null {
  if (call === null || !Number.isFinite(call.window_seconds) || call.window_seconds <= 0) {
    return null;
  }

  const createdAt = parseBoardTimestamp(call.created_at);

  return createdAt === null ? null : createdAt + call.window_seconds * 1000;
}

export function isWaiterCallActive(call: BoardWaiterCall | null, nowMs: number): boolean {
  const end = resolveWaiterCallEnd(call);

  return end !== null && nowMs < end;
}
