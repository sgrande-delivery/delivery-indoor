'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppScroller } from '@/components/shell/AppShell';

// A próxima página começa a carregar 240px antes do fim, para o rodapé de carregamento ser a exceção e não
// o estado normal de quem rola rápido.
const LOAD_MORE_ROOT_MARGIN = '0px 0px 240px 0px';

/**
 * O gatilho do scroll infinito. A raiz padrão é o scroller do `AppShell`: quem rola é ele, não a janela.
 *
 * Observar contra o viewport (`root: null`) perderia o `rootMargin`: com raiz implícita, o
 * `IntersectionObserver` recorta o alvo pelos ancestrais roláveis **antes** de aplicar a margem, e a
 * antecipação de 240px viraria um spinner em toda rolagem.
 *
 * `rootRef` é para quem rola noutro container, como a região da grade no tablet.
 */
export function useLoadMore(
  enabled: boolean,
  onLoadMore: () => void,
  rootRef?: React.RefObject<HTMLElement | null>
): (node: HTMLElement | null) => void {
  const appScrollerRef = useAppScroller();
  const scrollerRef = rootRef ?? appScrollerRef;
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const handler = useRef(onLoadMore);

  useEffect(() => {
    handler.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!enabled || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          handler.current();
        }
      },
      { root: scrollerRef.current, rootMargin: LOAD_MORE_ROOT_MARGIN }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [enabled, sentinel, scrollerRef]);

  return setSentinel;
}
