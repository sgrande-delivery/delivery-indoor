import { AxiosError } from 'axios';

/**
 * O envelope de erro que a `delivery-api` devolve (`bootstrap/app.php` e `RestaurantMiddleware`). Todo campo é
 * opcional porque nenhum aparece em todos os ramos: o 404 de restaurante traz só `error` e `message`, `code` só
 * existe no ramo de token vencido, e em produção `detail` vem como `[]`.
 */
export type ApiResponseError = {
  error?: string;
  message?: string;
  status_code?: number;
  internal_code?: string;
  code?: string;
  detail?: Record<string, unknown> | unknown[];
};

/**
 * O código de um erro da API, lido de qualquer dos dois envelopes: o `CoreDomainException` emite
 * `internal_code`, e o ramo de `TokenExpiredException` do `bootstrap/app.php` emite `code`. Nenhum dos
 * dois é assumido, para um código da v2 não passar despercebido por causa do nome da chave.
 */
export function readErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const { internal_code: internalCode, code } = data as Record<string, unknown>;

  if (typeof internalCode === 'string') {
    return internalCode;
  }

  return typeof code === 'string' ? code : undefined;
}

export function apiErrorInterceptor(error: AxiosError<ApiResponseError>): Promise<never> {
  console.error(`[api] request failed: ${error.response?.status ?? 'no status'} ${error.config?.url ?? ''}`);
  return Promise.reject(error);
}
