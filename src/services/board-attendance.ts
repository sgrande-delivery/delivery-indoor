import type { RequestBillResponse, WaiterCallResponse } from '@/types/board-attendance';
import { api } from './api';
import { isBoardWaiterCall } from './board-movement';

export function waiterCallMutationKey(id: string): readonly ['waiter-call', string] {
  return ['waiter-call', id];
}

export function billRequestMutationKey(id: string): readonly ['bill-request', string] {
  return ['bill-request', id];
}

/** Uma resposta que não tem a forma do contrato (proxy devolvendo HTML, por exemplo) é falha, e não "chamado". */
export class InvalidAttendanceResponseError extends Error {
  constructor(route: string) {
    super(`resposta de ${route} fora do contrato`);
    this.name = 'InvalidAttendanceResponseError';
  }
}

function isWaiterCallResponse(data: unknown): data is WaiterCallResponse {
  return isBoardWaiterCall(data) && typeof (data as { board_movement_id?: unknown }).board_movement_id === 'string';
}

function isRequestBillResponse(data: unknown): data is RequestBillResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as { bill_requested_at?: unknown }).bill_requested_at === 'string'
  );
}

export async function requestWaiterCall(id: string): Promise<WaiterCallResponse> {
  const { data } = await api.post<unknown>(`/boardMovements/${encodeURIComponent(id)}/waiter-calls`);

  if (!isWaiterCallResponse(data)) {
    throw new InvalidAttendanceResponseError('waiter-calls');
  }

  return data;
}

export async function requestBill(id: string): Promise<RequestBillResponse> {
  const { data } = await api.patch<unknown>(`/boardMovements/${encodeURIComponent(id)}/request-bill`);

  if (!isRequestBillResponse(data)) {
    throw new InvalidAttendanceResponseError('request-bill');
  }

  return data;
}
