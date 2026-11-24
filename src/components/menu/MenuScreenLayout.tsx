'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';

export interface MenuScreenLayoutProps {
  /** O que fica fixo no topo do tablet; no celular rola com a página. */
  header: React.ReactNode;
  regionRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}

// No celular as duas partes ficam no fluxo e quem rola é o scroller do shell. No tablet a moldura preenche o scroller
// (que tem altura definida) e só a região rola, então o cabeçalho não sai de cima.
const Root = styled('div')({
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'flex',
    flexDirection: 'column',
    blockSize: '100%',
  },
});

const Header = styled('div')({
  [`@media ${tabletShellMediaQuery}`]: {
    flexShrink: 0,
    minInlineSize: 0,
  },
});

const Region = styled('div')({
  [`@media ${tabletShellMediaQuery}`]: {
    flex: 1,
    minBlockSize: 0,
    overflowY: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
});

const MenuScreenLayout: React.FC<MenuScreenLayoutProps> = ({ header, regionRef, children }) => {
  return (
    <Root>
      <Header>{header}</Header>
      <Region ref={regionRef}>{children}</Region>
    </Root>
  );
};

export default MenuScreenLayout;
