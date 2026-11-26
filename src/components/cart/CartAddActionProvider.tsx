'use client';

import React, { PropsWithChildren, useMemo } from 'react';
import { ProductAddActionProvider } from '@/components/product/product-add-action';
import { ToastContextValue, useToast } from '@/components/ui';
import { readProductUnavailableMessage } from '@/services/cart';
import { ProductSelection } from '@/types/product-selection';
import { isTableClosedError, TABLE_CLOSED_MESSAGE } from './send-failure';
import { OfflineCartWriteError, useAddCartItem } from './use-add-cart-item';
import { useReadTableQr } from './use-read-table-qr';

const ADD_ERROR = 'Não foi possível adicionar à sacola. Tente de novo.';
const OFFLINE_ERROR = 'Sem conexão. Adicione de novo quando a internet voltar.';
const READ_QR_LABEL = 'Ler o QR code';

function announceAddFailure(error: unknown, toast: ToastContextValue, readTableQr: () => void): void {
  if (isTableClosedError(error)) {
    toast.show({
      message: TABLE_CLOSED_MESSAGE,
      variant: 'error',
      action: { label: READ_QR_LABEL, onClick: readTableQr },
    });

    return;
  }

  const message =
    error instanceof OfflineCartWriteError ? OFFLINE_ERROR : (readProductUnavailableMessage(error) ?? ADD_ERROR);

  toast.show({ message, variant: 'error' });
}

/**
 * Liga o "adicionar" do detalhe do produto ao carrinho v2. A falha é anunciada aqui, porque é esta árvore que lê os
 * códigos da sacola, e depois rejeitada: o detalhe só fica aberto, sem toast próprio.
 */
const CartAddActionProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { mutateAsync, isPending } = useAddCartItem();
  const toast = useToast();
  const readTableQr = useReadTableQr();

  const value = useMemo(
    () => ({
      isPending,
      add: async (selection: ProductSelection): Promise<void> => {
        try {
          await mutateAsync(selection);
        } catch (error) {
          announceAddFailure(error, toast, readTableQr);

          throw error;
        }
      },
    }),
    [mutateAsync, isPending, toast, readTableQr]
  );

  return <ProductAddActionProvider value={value}>{children}</ProductAddActionProvider>;
};

export default CartAddActionProvider;
