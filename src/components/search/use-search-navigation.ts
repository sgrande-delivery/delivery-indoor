'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { buildSearchHref, normalizeSearchTerm, SearchFilters } from '@/helpers/search-params';

export interface SearchNavigation {
  /** Aplica o recorte novo: cada toque é um endereço novo, e o estado da busca mora nele. */
  go: (next: SearchFilters) => void;
  /** Para um endereço já montado (a ação da faixa de relaxamento). */
  goTo: (href: string) => void;
  submit: (term: string) => void;
  clear: () => void;
}

/**
 * O envio troca o termo e **preserva** o resto do recorte; o `close` do campo limpa só o termo. Termo vazio no envio
 * não navega: a entrada continua onde está.
 */
export function useSearchNavigation(filters: SearchFilters): SearchNavigation {
  const router = useRouter();

  const goTo = useCallback((href: string) => router.push(href), [router]);

  const go = useCallback((next: SearchFilters) => goTo(buildSearchHref(next)), [goTo]);

  const submit = useCallback(
    (term: string) => {
      const normalized = normalizeSearchTerm(term);

      if (normalized !== '') {
        go({ ...filters, term: normalized });
      }
    },
    [filters, go]
  );

  const clear = useCallback(() => go({ ...filters, term: null }), [filters, go]);

  return { go, goTo, submit, clear };
}
