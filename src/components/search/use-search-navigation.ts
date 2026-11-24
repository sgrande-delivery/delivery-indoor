'use client';

import { useCallback } from 'react';
import { productSheetHistoryState } from '@/components/product/product-route';
import { hasActiveSearch, preserveSearchParams, SearchFilters, withSearchHref } from '@/helpers/search-params';

export interface SearchNavigation {
  /** Aplica o recorte novo: cada toque é uma entrada de histórico, e o estado da busca mora no endereço. */
  go: (next: SearchFilters) => void;
  /** Para um endereço já montado (a ação da faixa de relaxamento). */
  goTo: (href: string) => void;
  /** Troca só o termo: empilha ao sair da entrada, substitui com a busca ativa. */
  setTerm: (term: string | null) => void;
}

function pushHref(href: string): void {
  window.history.pushState(null, '', href);
}

/** O estado da entrada atual só com a marca da folha: o Next mescla o dele, e o voltar da folha segue valendo. */
function replaceHref(href: string): void {
  window.history.replaceState(productSheetHistoryState(), '', href);
}

/**
 * Escreve pela API de histórico, sem passar pelo servidor: o Next 15 reflete `pushState` e `replaceState` no
 * `useSearchParams`. Os parâmetros que não são do recorte (`product`) seguem no endereço.
 */
export function useSearchNavigation(filters: SearchFilters): SearchNavigation {
  const goTo = useCallback((href: string) => pushHref(preserveSearchParams(window.location.search, href)), []);

  const go = useCallback((next: SearchFilters) => pushHref(withSearchHref(window.location.search, next)), []);

  const setTerm = useCallback(
    (term: string | null) => {
      const href = withSearchHref(window.location.search, { ...filters, term });

      if (hasActiveSearch(filters)) {
        replaceHref(href);
        return;
      }

      pushHref(href);
    },
    [filters]
  );

  return { go, goTo, setTerm };
}
