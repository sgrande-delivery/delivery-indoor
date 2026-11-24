'use client';

import React, { useRef } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAppScroller } from '@/components/shell/AppShell';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';

/** O servidor não sabe a janela: na hidratação o primeiro render responde `false` e o valor real chega logo depois. */
export function useIsTabletShell(): boolean {
  return useMediaQuery(tabletShellMediaQuery);
}

export interface MenuScreenScroller {
  /** A região que rola no tablet; vai para `MenuScreenLayout`. */
  regionRef: React.RefObject<HTMLDivElement>;
  /** Quem de fato rola agora: a região no tablet, o scroller do shell no celular. */
  scrollerRef: React.RefObject<HTMLElement | null>;
  isTablet: boolean;
}

export function useMenuScreenScroller(): MenuScreenScroller {
  const regionRef = useRef<HTMLDivElement>(null);
  const appScrollerRef = useAppScroller();
  const isTablet = useIsTabletShell();

  return { regionRef, scrollerRef: isTablet ? regionRef : appScrollerRef, isTablet };
}
