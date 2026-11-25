'use client';

import React, { useRef } from 'react';
import { styled } from '@mui/material/styles';
import CartHeader from './CartHeader';
import CartPanel from './CartPanel';
import CartTableRow from './CartTableRow';

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

/** A sacola do celular: cabeçalho fixo e o painel, que rola por dentro. A raiz preenche o scroller do `AppShell`. */
const CartScreen: React.FC = () => {
  const toastAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <Root>
      <CartHeader />
      <CartPanel tableRow={<CartTableRow />} toastAnchorRef={toastAnchorRef} errorForm="route" />
      <ToastAnchor ref={toastAnchorRef} aria-hidden />
    </Root>
  );
};

export default CartScreen;
