'use client';

import React, { useRef } from 'react';
import { styled } from '@mui/material/styles';
import { useRestoredToastAnchor } from '@/providers/connectivity/ConnectivityProvider';
import { cartFooterMetrics } from '@/theme';
import CartFooter from './CartFooter';
import CartHeader from './CartHeader';
import CartPanel from './CartPanel';
import CartTableRow from './CartTableRow';
import { sendMetrics } from './send-metrics';
import OrderSentPanel from './sent/OrderSentPanel';
import { useCart } from './use-cart';
import { useSendOrder } from './use-send-order';

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100%',
});

// Fora da área que rola, no limite inferior do corpo: o toast sobe daqui e não cai sobre o que fica abaixo dele.
const ToastAnchor = styled('div')({
  blockSize: 0,
  flexShrink: 0,
});

const Footer = styled('footer')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  gap: sendMetrics.footerGap,
  paddingBlockStart: cartFooterMetrics.paddingBlockStart,
  paddingInline: cartFooterMetrics.paddingInline,
  paddingBlockEnd: cartFooterMetrics.paddingBlockEnd,
  borderBlockStart: `${cartFooterMetrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
  backgroundColor: theme.vars.palette.surface.card,
}));

/**
 * A sacola do celular: cabeçalho fixo, o painel que rola por dentro e o rodapé de envio. Enviado o pedido, o corpo
 * inteiro vira a confirmação, e sair da rota a descarta. A raiz preenche o scroller do `AppShell`.
 */
const CartScreen: React.FC = () => {
  const toastAnchorRef = useRef<HTMLDivElement>(null);
  useRestoredToastAnchor(toastAnchorRef);
  const { cart } = useCart();
  const send = useSendOrder();

  if (send.sent) {
    return (
      <Root>
        <OrderSentPanel sent={send.sent} />
      </Root>
    );
  }

  return (
    <Root>
      <CartHeader toastAnchorRef={toastAnchorRef} />
      <CartPanel tableRow={<CartTableRow />} toastAnchorRef={toastAnchorRef} />
      <ToastAnchor ref={toastAnchorRef} aria-hidden />
      {((cart && cart.items.length > 0) || send.isRetryable) && (
        <Footer>
          <CartFooter cart={cart ?? null} layout="stacked" send={send} />
        </Footer>
      )}
    </Root>
  );
};

export default CartScreen;
