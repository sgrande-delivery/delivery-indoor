'use client';

import React, { PropsWithChildren, useMemo } from 'react';
import { ProductAddActionProvider } from '@/components/product/product-add-action';
import { useToast } from '@/components/ui';
import { readProductUnavailableMessage } from '@/services/cart';
import { ProductSelection } from '@/types/product-selection';
import { useAddCartItem } from './use-add-cart-item';

const ADD_ERROR = 'Não foi possível adicionar à sacola. Tente de novo.';

/**
 * Liga o "adicionar" do detalhe do produto ao carrinho v2. A falha é anunciada aqui, porque é esta árvore que lê os
 * códigos da sacola, e depois rejeitada: o detalhe só fica aberto, sem toast próprio.
 */
const CartAddActionProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { mutateAsync, isPending } = useAddCartItem();
  const toast = useToast();

  const value = useMemo(
    () => ({
      isPending,
      add: async (selection: ProductSelection): Promise<void> => {
        try {
          await mutateAsync(selection);
        } catch (error) {
          toast.show({ message: readProductUnavailableMessage(error) ?? ADD_ERROR, variant: 'error' });

          throw error;
        }
      },
    }),
    [mutateAsync, isPending, toast]
  );

  return <ProductAddActionProvider value={value}>{children}</ProductAddActionProvider>;
};

export default CartAddActionProvider;
