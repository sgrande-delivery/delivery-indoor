const seenErrors = new WeakSet<object>();

let currentPathname: string | null = null;
let streak = 0;
let lastFailureAt = 0;

const FAILURE_WINDOW_MS = 60_000;

/**
 * A sequência de falhas do `app/error.tsx`. O boundary desmonta no `reset()` e monta outro na falha seguinte, então
 * um contador em `useState` zera sempre; por isso ela vive no módulo.
 *
 * Cada falha vale **uma vez**, pela identidade do `error`: o efeito e o render rodam mais de uma vez por falha
 * (rerender do pai), e contar por montagem chegaria em "instabilidade" na segunda falha.
 * A sequência recomeça quando o `pathname` muda e quando a falha chega mais de 60 s depois da anterior.
 *
 * O boundary não fica sabendo de um sucesso depois do retry, então ele não zera a conta; a janela de 60 s é o
 * que faz uma falha isolada, bem depois, voltar a ser a primeira. A query tem a sua conta própria e zera no
 * sucesso (`useQueryScreenState`).
 */
export function recordRouteFailure(pathname: string, error: unknown, now: number = Date.now()): number {
  if (pathname !== currentPathname) {
    currentPathname = pathname;
    streak = 0;
  }

  if (typeof error === 'object' && error !== null && !seenErrors.has(error)) {
    seenErrors.add(error);

    if (now - lastFailureAt > FAILURE_WINDOW_MS) {
      streak = 0;
    }

    streak += 1;
    lastFailureAt = now;
  }

  return Math.max(streak, 1);
}
