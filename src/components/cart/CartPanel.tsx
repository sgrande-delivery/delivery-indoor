'use client';

import React, { RefObject, useRef } from 'react';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import { useQueryScreenState } from '@/hooks/use-query-screen-state';
import { cartScreenMetrics } from '@/theme';
import CartEmpty from './CartEmpty';
import CartItemList from './CartItemList';
import CartLoadError from './CartLoadError';
import CartScreenSkeleton from './CartScreenSkeleton';
import CartTotals from './CartTotals';
import { useCart } from './use-cart';
import { useCartActions } from './use-cart-actions';

const REFRESH_ERROR = 'Não foi possível atualizar a sacola.';

export interface CartPanelProps {
  /** A linha da mesa. Só aparece com itens: o vazio e o erro falam sozinhos. */
  tableRow?: React.ReactNode;
  /** A linha no limite inferior do corpo, de onde os avisos sobem. */
  toastAnchorRef?: RefObject<HTMLElement>;
  errorForm?: 'route' | 'inline';
  className?: string;
}

interface RootProps {
  isCentered: boolean;
}

const Root = styled('div', {
  shouldForwardProp: prop => prop !== 'isCentered',
})<RootProps>(({ isCentered }) => ({
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  paddingInline: cartScreenMetrics.paddingInline,
  paddingBlockEnd: cartScreenMetrics.paddingBlockEnd,
  outline: 'none',
  ...(isCentered && {
    display: 'flex',
    flexDirection: 'column',
    '&::before': { content: '""', flex: `${cartScreenMetrics.emptyTopShare} 0 0px` },
    '&::after': { content: '""', flex: `${cartScreenMetrics.emptyBottomShare} 0 0px` },
  }),
}));

const TableSlot = styled('div')({
  marginBlockEnd: cartScreenMetrics.restaurantMarginBlockEnd,
});

const RefreshSlot = styled('div')({
  marginBlockStart: cartScreenMetrics.summaryMarginBlockStart,
});

/**
 * O conteúdo da sacola, sem cromo: o celular o monta na tela `/cart`, e o tablet, na coluna e no painel. Sem id
 * guardado a sacola é o vazio e não há request; com id, a primeira leitura é o esqueleto, e a releitura que falha
 * com a lista na tela vira aviso acima do total, sem derrubar a lista.
 */
const CartPanel: React.FC<CartPanelProps> = ({ tableRow, toastAnchorRef, errorForm = 'route', className }) => {
  const { cart, query, isFetching, retry } = useCart();
  const screen = useQueryScreenState(query);
  const actions = useCartActions({ anchorRef: toastAnchorRef });
  const rootRef = useRef<HTMLDivElement>(null);

  function handleRemove(itemId: number): void {
    actions.remove(itemId, () => {
      // a linha removida levou o foco para o `body`; com o foco em outro lugar, quem o tem fica com ele
      if (document.activeElement === document.body) {
        rootRef.current?.focus();
      }
    });
  }

  const isEmpty = cart === null || (cart !== undefined && cart.items.length === 0);

  function renderContent(): React.ReactNode {
    if (isEmpty) {
      return <CartEmpty />;
    }

    if (cart === undefined) {
      return screen.view === 'error' ? (
        <CartLoadError
          form={errorForm}
          error={screen.error}
          failureStreak={screen.failureStreak}
          isRetrying={isFetching}
          onRetry={retry}
        />
      ) : (
        <CartScreenSkeleton />
      );
    }

    return (
      <>
        {tableRow && <TableSlot>{tableRow}</TableSlot>}
        <CartItemList cart={cart} actions={actions} onRemove={handleRemove} />
        {screen.isRefreshFailed && (
          <RefreshSlot>
            <InlineError message={REFRESH_ERROR} onRetry={retry} isRetrying={isFetching} />
          </RefreshSlot>
        )}
        <CartTotals cart={cart} isFetching={isFetching} />
      </>
    );
  }

  return (
    <Root ref={rootRef} tabIndex={-1} isCentered={isEmpty} className={className}>
      {renderContent()}
    </Root>
  );
};

export default CartPanel;
