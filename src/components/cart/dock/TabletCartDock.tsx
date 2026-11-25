'use client';

import React, { useEffect, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { tabletPortraitShellMediaQuery } from '@/components/shell/shell-metrics';
import { useCart } from '../use-cart';
import { useCartItemCount } from '../use-cart-item-count';
import CartSheet from './CartSheet';
import { describeCartBar } from './describe-cart-bar';
import TabletCartBar from './TabletCartBar';

/**
 * A sacola do tablet em pé: a barra no pé (só com itens) e o painel que ela abre. O painel é estado daqui, e não da
 * barra: ele continua aberto quando a sacola esvazia lá dentro, e a confirmação do envio mora nele. Sai de cena
 * quando a orientação deixa de ser retrato, porque a coluna toma o lugar.
 */
const TabletCartDock: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isPortrait = useMediaQuery(tabletPortraitShellMediaQuery);
  const { cart } = useCart();
  const count = useCartItemCount();

  useEffect(() => {
    if (!isPortrait) {
      setIsOpen(false);
    }
  }, [isPortrait]);

  const summary = cart && count ? describeCartBar(count, cart.total) : null;

  return (
    <>
      <TabletCartBar summary={summary} announcement={summary?.announcement ?? ''} onOpen={() => setIsOpen(true)} />
      <CartSheet summary={summary} open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default TabletCartDock;
