import { isAxiosError } from 'axios';

/**
 * `throttled`: 429. `refused`: qualquer outro 4xx (mesa inexistente, liberada ou fechada): a mesa pode ter mudado.
 * `unreachable`: 5xx, resposta fora do contrato e rede, que o toque seguinte pode resolver.
 */
export type AttendanceFailure = 'throttled' | 'refused' | 'unreachable';

const THROTTLED_STATUS = 429;
const CLIENT_ERROR_MIN = 400;
const CLIENT_ERROR_MAX = 499;

export function resolveAttendanceFailure(error: unknown): AttendanceFailure {
  if (!isAxiosError(error) || error.response === undefined) {
    return 'unreachable';
  }

  const { status } = error.response;

  if (status === THROTTLED_STATUS) {
    return 'throttled';
  }

  return status >= CLIENT_ERROR_MIN && status <= CLIENT_ERROR_MAX ? 'refused' : 'unreachable';
}
