'use client';

import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { styled } from '@mui/material/styles';
import OfflineBanner from '@/components/offline/OfflineBanner';
import WaiterCallButton from '@/components/waiter/WaiterCallButton';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBoardSession } from '@/providers/board-session';
import { appShellMetrics, CHROME_BOTTOM_INSET_VAR } from '@/theme';
import ShellNav from './ShellNav';
import { tabletShellMediaQuery } from './shell-metrics';
import { resolveActiveTab, shellTabsFor } from './shell-tabs';
import TableTopBar, { TableTopBarTable } from './TableTopBar';

/**
 * A moldura que toda rota recebe: no celular, a navegação inferior; no tablet, a `TableTopBar` fixa.
 * O formato é escolhido por CSS (`tabletShellMediaQuery`), e não por hook de media query: os dois cromos
 * estão no HTML do servidor e o inativo fica em `display: none`, então não há remontagem na hidratação.
 *
 * Contrato com as telas:
 * - O documento nunca rola, e a região de conteúdo (`<main>`) tem altura definida e **não tem padding**.
 * - A tela que precisa de partes fixas (duas colunas no tablet deitado, rodapé fixo) preenche a região
 *   com `blockSize: 100%` e rola por dentro.
 * - Quem observa rolagem nessas telas passa o próprio container, em vez de `useAppScroller()`.
 */

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100dvh',
  backgroundColor: theme.vars.palette.surface.page,
}));

const TopBarSlot = styled('div')({
  display: 'none',
  flexShrink: 0,
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'block',
  },
});

const Frame = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minBlockSize: 0,
  inlineSize: '100%',
  maxInlineSize: appShellMetrics.maxInlineSize,
  marginInline: 'auto',
  [`@media ${tabletShellMediaQuery}`]: {
    maxInlineSize: 'none',
  },
});

const Scroller = styled('main')({
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

interface ChromeBlockProps {
  isHidden: boolean;
}

const ChromeBlock = styled('div', {
  shouldForwardProp: prop => prop !== 'isHidden',
})<ChromeBlockProps>(({ isHidden }) => ({
  display: isHidden ? 'none' : 'block',
  flexShrink: 0,
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'none',
  },
}));

const ScrollerContext = createContext<React.RefObject<HTMLElement | null> | null>(null);

export function useAppScroller(): React.RefObject<HTMLElement | null> {
  const ref = useContext(ScrollerContext);

  if (!ref) {
    throw new Error('useAppScroller precisa estar dentro do AppShell');
  }

  return ref;
}

const tabletTabs = shellTabsFor('tablet');

const AppShell: React.FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const session = useBoardSession();
  const restaurant = useRestaurant();
  const scrollerRef = useRef<HTMLElement>(null);
  const [chromeBlock, setChromeBlock] = useState<HTMLDivElement | null>(null);
  const scrollerValue = useMemo(() => scrollerRef, []);

  const showChrome = session.hasTable || session.isLoading;

  let table: TableTopBarTable = { kind: 'none' };

  if (session.status === 'ready') {
    table = { kind: 'ready', label: `Mesa ${session.movement.board.number}` };
  } else if (session.status === 'loading') {
    table = { kind: 'loading' };
  } else if (session.status === 'error') {
    table = { kind: 'unavailable' };
  }

  const image = restaurant.data?.image;
  const brand = {
    name: restaurant.data?.name ?? null,
    logoUrl: image?.imageThumbUrl ?? image?.imageUrl ?? null,
    isLoading: restaurant.isPending,
  };

  // O cromo inferior em `display: none` (tablet ou "sem mesa") mede 0 e o toast desce para a borda.
  useEffect(() => {
    if (!chromeBlock) {
      return undefined;
    }

    const root = document.documentElement;
    const block = chromeBlock;

    function publish(): void {
      root.style.setProperty(CHROME_BOTTOM_INSET_VAR, `${block.getBoundingClientRect().height}px`);
    }

    publish();

    const observer = new ResizeObserver(publish);

    observer.observe(block, { box: 'border-box' });

    return () => {
      observer.disconnect();
      root.style.removeProperty(CHROME_BOTTOM_INSET_VAR);
    };
  }, [chromeBlock]);

  return (
    <ScrollerContext.Provider value={scrollerValue}>
      <Root>
        <TopBarSlot>
          <TableTopBar
            brand={brand}
            table={table}
            tabs={tabletTabs}
            activeTab={resolveActiveTab(pathname, 'tablet')}
            action={<WaiterCallButton collapsible />}
          />
        </TopBarSlot>
        <OfflineBanner />
        <Frame>
          <Scroller ref={scrollerRef}>{children}</Scroller>
          <ChromeBlock ref={setChromeBlock} isHidden={!showChrome}>
            {showChrome && <ShellNav activeTab={resolveActiveTab(pathname, 'phone')} />}
          </ChromeBlock>
        </Frame>
      </Root>
    </ScrollerContext.Provider>
  );
};

export default AppShell;
