'use client';

import React, { RefObject, useRef } from 'react';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import { useQueryScreenState } from '@/hooks/use-query-screen-state';
import { cartScreenMetrics } from '@/theme';
import { CartVariant, cartPanelForms } from './cart-metrics';
import CartEmpty from './CartEmpty';
import CartItemList from './CartItemList';
import CartLoadError from './CartLoadError';
import CartScreenSkeleton from './CartScreenSkeleton';
import CartSendPending from './CartSendPending';
import CartTotals from './CartTotals';
import { useCart } from './use-cart';
import { useCartActions } from './use-cart-actions';
import { useSendStatus } from './use-send-status';

const REFRESH_ERROR = 'Não foi possível atualizar a sacola.';

export interface CartPanelProps {
  /** A linha da mesa. Só aparece com itens: o vazio e o erro falam sozinhos. */
  tableRow?: React.ReactNode;
  /** A linha no limite inferior do corpo, de onde os avisos sobem. */
  toastAnchorRef?: RefObject<HTMLElement>;
  /**
   * A moldura: `screen` é a tela do celular, com o total no fim do corpo; `column` e `sheet` são as do tablet, onde o
   * total mora no rodapé de quem monta o painel e o vazio não leva ao cardápio.
   */
  variant?: CartVariant;
  className?: string;
}

interface RootProps {
  isCentered: boolean;
  form: CartVariant;
}

const Root = styled('div', {
  shouldForwardProp: prop => prop !== 'isCentered' && prop !== 'form',
})<RootProps>(({ isCentered, form }) => ({
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  paddingInline: cartPanelForms[form].paddingInline,
  paddingBlockStart: cartPanelForms[form].paddingBlockStart,
  paddingBlockEnd: cartScreenMetrics.paddingBlockEnd,
  outline: 'none',
  ...(isCentered && {
    display: 'flex',
    flexDirection: 'column',
    // a coluna centraliza o vazio, como o artboard; o 2/7 e 5/7 é o respiro da tela inteira do celular
    '&::before': { content: '""', flex: `${form === 'screen' ? cartScreenMetrics.emptyTopShare : 1} 0 0px` },
    '&::after': { content: '""', flex: `${form === 'screen' ? cartScreenMetrics.emptyBottomShare : 1} 0 0px` },
  }),
}));

const TableSlot = styled('div', {
  shouldForwardProp: prop => prop !== 'form',
})<{ form: CartVariant }>(({ form }) => ({
  marginBlockEnd: cartPanelForms[form].tableMarginBlockEnd,
}));

const RefreshSlot = styled('div')({
  marginBlockStart: cartScreenMetrics.summaryMarginBlockStart,
});

/**
 * O conteúdo da sacola, sem cromo: o celular o monta na tela `/cart`, e o tablet, na coluna e no painel. Sem id
 * guardado a sacola é o vazio e não há request; com id, a primeira leitura é o esqueleto, e a releitura que falha
 * com a lista na tela vira aviso acima do total, sem derrubar a lista.
 */
const CartPanel: React.FC<CartPanelProps> = ({ tableRow, toastAnchorRef, variant = 'screen', className }) => {
  const { cart, query, isFetching, retry } = useCart();
  const screen = useQueryScreenState(query);
  const actions = useCartActions({ anchorRef: toastAnchorRef });
  const { isRetryable } = useSendStatus();
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
    if (cart === null && isRetryable) {
      return <CartSendPending />;
    }

    if (isEmpty) {
      return <CartEmpty hasMenuAction={variant === 'screen'} />;
    }

    if (cart === undefined) {
      return screen.view === 'error' ? (
        <CartLoadError
          form={variant === 'screen' ? 'route' : 'inline'}
          error={screen.error}
          failureStreak={screen.failureStreak}
          isRetrying={isFetching}
          onRetry={retry}
        />
      ) : (
        <CartScreenSkeleton hasTableRow={Boolean(tableRow)} />
      );
    }

    return (
      <>
        {tableRow && <TableSlot form={variant}>{tableRow}</TableSlot>}
        <CartItemList cart={cart} actions={actions} onRemove={handleRemove} variant={variant} />
        {screen.isRefreshFailed && (
          <RefreshSlot>
            <InlineError message={REFRESH_ERROR} onRetry={retry} isRetrying={isFetching} />
          </RefreshSlot>
        )}
        {variant === 'screen' && <CartTotals cart={cart} isFetching={isFetching} />}
      </>
    );
  }

  return (
    <Root ref={rootRef} tabIndex={-1} data-cart-panel isCentered={isEmpty} form={variant} className={className}>
      {renderContent()}
    </Root>
  );
};

export default CartPanel;
