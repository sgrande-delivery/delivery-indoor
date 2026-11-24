const PROBE_PATH = '/api/ping';
const PROBE_TIMEOUT_MS = 5000;

/**
 * Mede a origem do próprio app, e não a `delivery-api`: com a internet de pé e a API caída o probe responde, e a
 * falha vira erro de rota com código. Só a internet caída o faz falhar.
 */
export async function probeConnection(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    await fetch(`${PROBE_PATH}?probe=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });

    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
