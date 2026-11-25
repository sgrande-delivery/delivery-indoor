import { isAxiosError } from 'axios';
import { BoardMovementDetail, BoardWaiterCall } from '@/types/board-movement';
import { api } from './api';
import { readErrorCode } from './api-error-interceptor';

const BOARD_MOVEMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function boardMovementQueryKey(id: string): readonly ['board-movement', string] {
  return ['board-movement', id];
}

export function isBoardMovementId(value: string | null | undefined): value is string {
  return typeof value === 'string' && BOARD_MOVEMENT_ID_PATTERN.test(value);
}

/** Um 200 que não é uma movimentação (proxy devolvendo HTML, por exemplo) é falha, não "mesa fechada". */
export class InvalidBoardMovementResponseError extends Error {
  constructor() {
    super('resposta de /boardMovements/{id} fora do contrato');
    this.name = 'InvalidBoardMovementResponseError';
  }
}

function isBoardMovementPayload(data: unknown): data is BoardMovementDetail {
  return typeof data === 'object' && data !== null && typeof (data as { is_open?: unknown }).is_open === 'boolean';
}

export function isBoardWaiterCall(value: unknown): value is BoardWaiterCall {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { id, created_at: createdAt, window_seconds: windowSeconds } = value as Record<string, unknown>;

  return typeof id === 'string' && typeof createdAt === 'string' && typeof windowSeconds === 'number';
}

export async function fetchBoardMovement(id: string): Promise<BoardMovementDetail> {
  const { data } = await api.get<unknown>(`/boardMovements/${encodeURIComponent(id)}`);

  if (!isBoardMovementPayload(data)) {
    throw new InvalidBoardMovementResponseError();
  }

  // a rota devolve o cliente inteiro (e-mail, telefone, CPF): só o nome fica no cache e no contexto
  const { waiter_call: waiterCall } = data as { waiter_call?: unknown };

  return {
    ...data,
    waiter_call: isBoardWaiterCall(waiterCall)
      ? { id: waiterCall.id, created_at: waiterCall.created_at, window_seconds: waiterCall.window_seconds }
      : null,
    customer: data.customer ? { id: data.customer.id, name: data.customer.name } : null,
  };
}

/** "Inexistente" é 404 com `internal_code: not_found`; o 404 de restaurante errado não traz o código. */
export function isBoardMovementNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404 && readErrorCode(error.response.data) === 'not_found';
}
