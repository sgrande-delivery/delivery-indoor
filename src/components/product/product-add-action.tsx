'use client';

import React, { createContext, useContext } from 'react';
import { ProductSelection } from '@/types/product-selection';

export interface ProductAddAction {
  /**
   * Resolve quando o item entrou na sacola. Rejeita quando não entrou, depois de quem provê ter
   * anunciado o motivo: o detalhe não escreve mensagem de falha, só fica aberto.
   */
  add: (selection: ProductSelection) => Promise<void>;
  isPending: boolean;
}

// Sem provedor o valor é `null`: o detalhe não fala com o carrinho, e quem o provê é a sacola.
const ProductAddActionContext = createContext<ProductAddAction | null>(null);

export function ProductAddActionProvider({
  value,
  children,
}: {
  value: ProductAddAction;
  children: React.ReactNode;
}): React.ReactElement {
  return <ProductAddActionContext.Provider value={value}>{children}</ProductAddActionContext.Provider>;
}

export function useProductAddAction(): ProductAddAction | null {
  return useContext(ProductAddActionContext);
}
