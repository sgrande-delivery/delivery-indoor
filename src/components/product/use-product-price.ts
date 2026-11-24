'use client';

import { useCallback, useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchProductPrice } from '@/services/product';
import { ProductPrice } from '@/types/product-detail';
import { OptionSelection } from '@/types/product-selection';

export const PRODUCT_PRICE_QUERY_KEY = 'product-price';

export const PRODUCT_PRICE_DEBOUNCE_MS = 300;

// A chave carrega a seleção inteira, então voltar a uma combinação já vista responde do cache sem
// request novo — o que só vale enquanto a resposta estiver fresca.
const PRODUCT_PRICE_STALE_TIME = 5 * 60 * 1000;

interface PricingSelection {
  quantity: number;
  optionSelections: OptionSelection[];
}

export interface UseProductPriceParams extends PricingSelection {
  publicId: string;
  enabled: boolean;
}

export interface UseProductPrice {
  price: ProductPrice | undefined;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  /** A seleção na tela ainda não é a que o servidor está calculando: o total visível é o da anterior. */
  isSettling: boolean;
  retry: () => void;
}

// `id:quantidade` ordenado por id: a mesma seleção alcançada em outra ordem reusa o cache.
export function serializeOptionSelections(optionSelections: OptionSelection[]): string {
  return optionSelections
    .map(selection => `${selection.option_group_item_id}:${selection.quantity ?? 1}`)
    .sort((first, second) => Number.parseInt(first, 10) - Number.parseInt(second, 10))
    .join(',');
}

function isSameSelection(current: PricingSelection, next: PricingSelection): boolean {
  return (
    current.quantity === next.quantity &&
    serializeOptionSelections(current.optionSelections) === serializeOptionSelections(next.optionSelections)
  );
}

export function useProductPrice(params: UseProductPriceParams): UseProductPrice {
  const { publicId, quantity, optionSelections, enabled } = params;
  const [selection, setSelection] = useState<PricingSelection>(() => ({ quantity, optionSelections }));
  const [wasEnabled, setWasEnabled] = useState(enabled);

  // Ao ser habilitado, o preço consulta a seleção que está na tela, sem esperar o debounce: não há
  // clique a juntar, e a seleção debounced pode ser a do mount, anterior ao padrão do detalhe.
  if (enabled !== wasEnabled) {
    setWasEnabled(enabled);

    if (enabled && !isSameSelection(selection, { quantity, optionSelections })) {
      setSelection({ quantity, optionSelections });
    }
  }

  // Uma sequência de cliques vira um pedido só: o timer reinicia a cada mudança e só a última
  // seleção chega na query. O timer escreve **valor**, nunca um atualizador que devolve o estado
  // corrente: o atualizador que sai por bailout fica na fila e desfaz a adoção acima no render seguinte.
  useEffect(() => {
    const next = { quantity, optionSelections };

    if (isSameSelection(selection, next)) {
      return;
    }

    const timer = setTimeout(() => setSelection(next), PRODUCT_PRICE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [selection, quantity, optionSelections]);

  const query = useQuery({
    queryKey: [
      PRODUCT_PRICE_QUERY_KEY,
      publicId,
      selection.quantity,
      serializeOptionSelections(selection.optionSelections),
    ],
    queryFn: () => fetchProductPrice(publicId, selection),
    enabled,
    // O valor anterior fica visível enquanto o servidor responde: nada zera, nada é recalculado aqui.
    placeholderData: keepPreviousData,
    staleTime: PRODUCT_PRICE_STALE_TIME,
    // 422 de seleção que não fecha é resposta de negócio, não falha de rede — repetir não muda nada.
    retry: false,
  });

  const { refetch } = query;

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const isSettling = enabled && !isSameSelection(selection, { quantity, optionSelections });

  return {
    price: query.data,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isSettling,
    retry,
  };
}
