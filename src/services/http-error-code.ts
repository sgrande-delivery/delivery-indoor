import { isAxiosError } from 'axios';
import { readErrorCode } from './api-error-interceptor';

const CODE_PREFIX = 'erro ';
const CODE_SEPARATOR = ' · ';
const NETWORK_CODE = 'erro de rede';
const RENDER_ERROR_CODE = 'erro 500';

/**
 * O código que a tela mostra no primeiro paint (RF-11), então nunca devolve `null`: com a API fora não há
 * resposta HTTP, e é justo aí que o cliente precisa ter o que dizer ao garçom.
 */
export function resolveErrorCode(error: unknown): string {
  if (!isAxiosError(error)) {
    return RENDER_ERROR_CODE;
  }

  if (!error.response) {
    return NETWORK_CODE;
  }

  const status = `${CODE_PREFIX}${error.response.status}`;
  const internalCode = readErrorCode(error.response.data);

  return internalCode ? `${status}${CODE_SEPARATOR}${internalCode}` : status;
}
