'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useOverlayPresence } from '@/hooks/use-overlay-presence';
import { dismissProductSheet, PRODUCT_SEARCH_PARAM } from '../product-route';
import ProductSheetDialog from './ProductSheetDialog';

// O produto aberto é estado de rota, mas a rota é atualizada pelo History API: fechar consome a
// entrada que a abertura empurrou, então o back do navegador fecha o modal em vez de reabri-lo, e
// nem abrir nem fechar re-executa o server component do cardápio.
const ProductSheet: React.FC = () => {
  const searchParams = useSearchParams();
  const presence = useOverlayPresence(searchParams.get(PRODUCT_SEARCH_PARAM));

  if (presence.value === null) {
    return null;
  }

  return (
    <ProductSheetDialog
      key={presence.value}
      publicId={presence.value}
      open={presence.open}
      onExited={presence.onExited}
      onClose={dismissProductSheet}
    />
  );
};

export default ProductSheet;
