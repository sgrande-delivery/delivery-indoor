'use client';

import { useBoardProducts } from '@/hooks/use-board-products';
import type { BoardRoundStatus } from '@/types/board-bill';

export interface SentOrderRound {
  round: number;
  /** `null` com a api publicada sem o `round_status`: a rodada sai só com o número. */
  status: BoardRoundStatus | null;
}

/**
 * A rodada do pedido recém-enviado, lida da conta e casada por `order_public_id`. `undefined` é "a leitura ainda não
 * chegou"; `null` é "não há o que mostrar" (a leitura falhou, ou o item não está nela): rodada não se inventa.
 */
export function useSentOrderRound(movementId: string, orderId: string): SentOrderRound | null | undefined {
  const query = useBoardProducts(movementId);
  const item = query.data?.products.find(product => product.order_public_id === orderId);

  if (item) {
    return { round: item.round, status: item.round_status };
  }

  // a conta lida antes do envio não tem o item: a releitura que a invalidação disparou ainda vai trazê-lo
  return query.isFetching ? undefined : null;
}
