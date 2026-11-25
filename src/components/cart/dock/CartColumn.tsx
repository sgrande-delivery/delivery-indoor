'use client';

import React, { useRef } from 'react';
import { styled } from '@mui/material/styles';
import CartPanel from '../CartPanel';
import { cartDockMetrics } from './cart-dock-metrics';
import CartColumnHeader from './CartColumnHeader';
import CartDockTotals from './CartDockTotals';

const ARIA_LABEL = 'Sua sacola';

const Root = styled('aside')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  inlineSize: cartDockMetrics.column.inlineSize,
  minBlockSize: 0,
  backgroundColor: theme.vars.palette.surface.card,
  borderInlineStart: `1px solid ${theme.vars.palette.surface.line}`,
}));

const Body = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minBlockSize: 0,
});

// No limite inferior do corpo: o aviso sobe daqui e não cai sobre o rodapé.
const ToastAnchor = styled('div')({
  blockSize: 0,
  flexShrink: 0,
});

// Hoje o rodapé só tem o total, e sem itens ele some (`:empty`). O `:empty` sai na #48, quando o rodapé ganhar "Pedindo como" e o botão de enviar, que ficam montados com a coluna vazia.
const Footer = styled('footer')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  gap: cartDockMetrics.column.footerGap,
  paddingBlockStart: cartDockMetrics.column.footerPaddingBlockStart,
  paddingInline: cartDockMetrics.column.footerPaddingInline,
  paddingBlockEnd: cartDockMetrics.column.footerPaddingBlockEnd,
  borderBlockStart: `1px solid ${theme.vars.palette.surface.line}`,
  '&:empty': {
    display: 'none',
  },
}));

/**
 * A sacola do tablet em paisagem: fixa ao lado do cardápio, com rolagem própria, e que não some quando está vazia.
 * A altura vem do `Workspace` do shell, que já desconta a barra superior.
 */
const CartColumn: React.FC = () => {
  const toastAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <Root aria-label={ARIA_LABEL}>
      <CartColumnHeader />
      <Body>
        <CartPanel variant="column" toastAnchorRef={toastAnchorRef} />
        <ToastAnchor ref={toastAnchorRef} aria-hidden />
      </Body>
      <Footer>
        <CartDockTotals variant="column" />
      </Footer>
    </Root>
  );
};

export default CartColumn;
