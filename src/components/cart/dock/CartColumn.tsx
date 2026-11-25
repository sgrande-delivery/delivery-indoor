'use client';

import React, { useRef } from 'react';
import { styled } from '@mui/material/styles';
import { useRestoredToastAnchor } from '@/providers/connectivity/ConnectivityProvider';
import CartClearAction from '../CartClearAction';
import CartFooter from '../CartFooter';
import CartPanel from '../CartPanel';
import OrderSentColumn from '../sent/OrderSentColumn';
import { useCart } from '../use-cart';
import { useSendOrder } from '../use-send-order';
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

// Fica montado com a coluna vazia: o botão de enviar aparece desabilitado, para a coluna não piscar.
const Footer = styled('footer')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  gap: cartDockMetrics.column.footerGap,
  paddingBlockStart: cartDockMetrics.column.footerPaddingBlockStart,
  paddingInline: cartDockMetrics.column.footerPaddingInline,
  paddingBlockEnd: cartDockMetrics.column.footerPaddingBlockEnd,
  borderBlockStart: `1px solid ${theme.vars.palette.surface.line}`,
}));

/**
 * A sacola do tablet em paisagem: fixa ao lado do cardápio, com rolagem própria, e que não some quando está vazia.
 * Enviado o pedido, a confirmação ocupa a coluna até "Continuar no cardápio" ou até a sacola voltar a ter item. A
 * altura vem do `Workspace` do shell, que já desconta a barra superior.
 */
const CartColumn: React.FC = () => {
  const toastAnchorRef = useRef<HTMLDivElement>(null);
  useRestoredToastAnchor(toastAnchorRef);
  const { cart } = useCart();
  const send = useSendOrder();
  const { sent, resetSent } = send;

  // ajustado no render, e não em efeito: a confirmação de uma sacola que já passou não ocupa nem um frame da nova
  if (sent !== null && cart && cart.items.length > 0 && cart.id !== sent.cartId) {
    resetSent();
  }

  if (sent) {
    return (
      <Root aria-label={ARIA_LABEL}>
        <OrderSentColumn sent={sent} variant="column" onContinue={resetSent} />
      </Root>
    );
  }

  return (
    <Root aria-label={ARIA_LABEL}>
      <CartColumnHeader action={<CartClearAction form="column" anchorRef={toastAnchorRef} />} />
      <Body>
        <CartPanel variant="column" toastAnchorRef={toastAnchorRef} />
        <ToastAnchor ref={toastAnchorRef} aria-hidden />
      </Body>
      <Footer>
        <CartDockTotals variant="column" />
        <CartFooter cart={cart ?? null} layout="stacked" send={send} />
      </Footer>
    </Root>
  );
};

export default CartColumn;
