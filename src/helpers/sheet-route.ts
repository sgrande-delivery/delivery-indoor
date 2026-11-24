export interface SheetRoute {
  param: string;
  href: (pathname: string, value: string, search: string) => string;
  push: (value: string) => void;
  dismiss: () => void;
}

/**
 * Uma sobreposição endereçada por parâmetro de busca, como o detalhe do produto (`?product=`). O valor vive na URL para o back do navegador fechar o
 * modal em vez de sair da tela, e os demais parâmetros da rota são preservados — quem abre um
 * produto a partir de um resultado filtrado volta para o mesmo resultado.
 *
 * `router.push` refaria o round-trip do server component da rota a cada abertura e a cada fechamento.
 * O Next 15 reflete `pushState` e `replaceState` nativos no `useSearchParams`, então a URL muda sem
 * ida ao servidor.
 *
 * A marca em `history.state` identifica a entrada que o próprio app empurrou ao abrir. Fechar consome
 * essa entrada com `back()`; sem a marca — entrada direta pela URL, link compartilhado ou recarga com
 * o modal aberto — não há entrada nossa para consumir, e voltar levaria o cliente para fora do site.
 */
export function createSheetRoute(param: string, historyMark: string): SheetRoute {
  function href(pathname: string, value: string, search: string): string {
    const params = new URLSearchParams(search);
    params.set(param, value);

    return `${pathname}?${params.toString()}`;
  }

  function baseHref(pathname: string, search: string): string {
    const params = new URLSearchParams(search);
    params.delete(param);
    const query = params.toString();

    return query === '' ? pathname : `${pathname}?${query}`;
  }

  function wasPushedByApp(): boolean {
    const state: unknown = window.history.state;

    if (typeof state !== 'object' || state === null) {
      return false;
    }

    return historyMark in state && state[historyMark] === true;
  }

  function push(value: string): void {
    const { pathname, search } = window.location;

    window.history.pushState({ [historyMark]: true }, '', href(pathname, value, search));
  }

  function dismiss(): void {
    if (wasPushedByApp()) {
      window.history.back();
      return;
    }

    const { pathname, search } = window.location;

    window.history.replaceState(null, '', baseHref(pathname, search));
  }

  return { param, href, push, dismiss };
}
