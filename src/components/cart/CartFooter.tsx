'use client';

import React, { useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { styled } from '@mui/material/styles';
import OrderingAsRow from '@/components/person/OrderingAsRow';
import PersonNameDialog from '@/components/person/PersonNameDialog';
import { useRestaurant } from '@/hooks/use-restaurant';
import { formatCents } from '@/helpers/money';
import { usePerson } from '@/providers/person';
import { Cart } from '@/types/cart';
import CartSendButton from './CartSendButton';
import { CART_CLEAR_MUTATION_KEY } from './cart-query';
import SendBlockNotice from './SendBlockNotice';
import SendFailureNotice from './SendFailureNotice';
import { readSendFailure } from './send-failure';
import { sendMetrics } from './send-metrics';
import { useReadTableQr } from './use-read-table-qr';
import { UseSendOrder } from './use-send-order';
import { useSendBlock } from './use-send-block';

type DialogMode = 'first-send' | 'change';

export interface CartFooterProps {
  cart: Cart | null;
  /**
   * `stacked` empilha o "Pedindo como" centrado sobre o CTA (celular e coluna); `inline` os põe lado a lado, com o CTA
   * ocupando o que sobra (painel de retrato). Quem monta o rodapé põe os totais e o espaçamento entre os filhos.
   */
  layout: 'stacked' | 'inline';
  send: UseSendOrder;
}

const OrderingSlot = styled('div')({
  marginBlock: -sendMetrics.orderingBleed,
});

const InlineRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: sendMetrics.inlineGap,
});

const InlineOrderingSlot = styled(OrderingSlot)({
  flexShrink: 1,
  minInlineSize: 0,
});

const InlineSend = styled(CartSendButton)({
  flex: 1,
  minInlineSize: 0,
  inlineSize: 'auto',
});

/**
 * O envio da sacola: o "Pedindo como", a falha, o motivo da trava e o CTA. O primeiro envio sem nome abre o diálogo e
 * só chama a API depois dele; o nome fica salvo mesmo se o envio falhar, e a nova tentativa não o pede de novo.
 */
const CartFooter: React.FC<CartFooterProps> = ({ cart, layout, send }) => {
  const { person, needsPerson, setPerson } = usePerson();
  const block = useSendBlock();
  const restaurant = useRestaurant();
  const isClearing = useIsMutating({ mutationKey: CART_CLEAR_MUTATION_KEY }) > 0;
  const readTableQr = useReadTableQr();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('first-send');
  const hasItems = Boolean(cart && cart.items.length > 0);

  function openDialog(mode: DialogMode): void {
    setDialogMode(mode);
    setIsDialogOpen(true);
  }

  function handleSend(): void {
    if (needsPerson) {
      openDialog('first-send');

      return;
    }

    if (person) {
      send.send(person);
    }
  }

  function handleRetry(): void {
    if (send.isRetryable) {
      send.retry();

      return;
    }

    if (person) {
      send.send(person);
    }
  }

  function handleConfirm(name: string): void {
    const saved = setPerson(name);

    if (dialogMode === 'change') {
      setIsDialogOpen(false);

      return;
    }

    const isAccepted = send.send(saved, { onSettled: () => setIsDialogOpen(false) });

    if (!isAccepted) {
      setIsDialogOpen(false);
    }
  }

  const ordering = person ? (
    <OrderingAsRow name={person} onChange={() => openDialog('change')} disabled={send.isSending} />
  ) : null;

  const failureData = send.error !== null ? readSendFailure(send.error) : null;
  // a cozinha fechada que a trava já diz não se repete; sem o restaurante lido, a falha é o único aviso
  const isKitchenCovered = failureData?.kind === 'kitchen-closed' && restaurant.data !== undefined;

  const failure =
    failureData !== null && !isKitchenCovered ? (
      <SendFailureNotice
        failure={failureData}
        onRetry={handleRetry}
        onReadQr={readTableQr}
        isRetrying={send.isSending}
        isBlocked={block !== null || isClearing}
      />
    ) : null;

  const blockNotice = block ? <SendBlockNotice message={block.message} /> : null;

  const isDisabled = !hasItems || block !== null || isClearing || person === undefined;
  const total = hasItems && cart ? cart.total : null;

  const dialog =
    dialogMode === 'first-send' ? (
      <PersonNameDialog
        mode="first-send"
        totalLabel={cart ? formatCents(cart.total) : ''}
        open={isDialogOpen}
        initialName={person ?? null}
        isSubmitting={send.isSending}
        onConfirm={handleConfirm}
        onClose={() => setIsDialogOpen(false)}
      />
    ) : (
      <PersonNameDialog
        mode="change"
        open={isDialogOpen}
        initialName={person ?? null}
        onConfirm={handleConfirm}
        onClose={() => setIsDialogOpen(false)}
      />
    );

  if (layout === 'inline') {
    return (
      <>
        {failure}
        {blockNotice}
        <InlineRow>
          {ordering && <InlineOrderingSlot>{ordering}</InlineOrderingSlot>}
          <InlineSend total={total} isSending={send.isSending} disabled={isDisabled} onSend={handleSend} />
        </InlineRow>
        {dialog}
      </>
    );
  }

  return (
    <>
      {ordering && <OrderingSlot>{ordering}</OrderingSlot>}
      {failure}
      {blockNotice}
      <CartSendButton total={total} isSending={send.isSending} disabled={isDisabled} onSend={handleSend} />
      {dialog}
    </>
  );
};

export default CartFooter;
