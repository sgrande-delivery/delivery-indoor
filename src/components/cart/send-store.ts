import { CartItem } from '@/types/cart';
import { readSendFailure, SendFailureKind } from './send-failure';

/**
 * A foto do envio, guardada inteira: reenviar depois de uma falha sem resposta não pode depender da sacola lida,
 * porque o pedido pode ter entrado e o `GET /cart` então a devolve `checked_out`, que a tela trata como sem sacola.
 * O token entra porque a chave de idempotência é escopada por ele no servidor.
 */
export interface SendAttempt {
  cartId: string;
  customerName: string;
  key: string;
  sessionToken: string | undefined;
  items: CartItem[];
  itemCount: number;
  movementId: string;
  /**
   * O total novo que o cliente aceitou, em centavos; `null` sem aceite. O envio leva `accept_price_change` quando há
   * valor, e o retry de rede reenvia a tentativa inteira, então o que a tela mostra e o que sai não divergem.
   */
  acceptedTotal: number | null;
}

export interface SendState {
  /** A tentativa que pode ser reenviada com a mesma chave; `null` quando o servidor já respondeu de forma registrada. */
  attempt: SendAttempt | null;
  isSending: boolean;
  error: unknown;
}

type Listener = () => void;

const IDLE: SendState = { attempt: null, isSending: false, error: null };

let state: SendState = IDLE;

const listeners = new Set<Listener>();

// Escopo do módulo, e não do hook: a coluna e o painel ficam montados juntos e a tela do celular remonta, então a trava
// e a chave valem para o aparelho, e dois toques em molduras diferentes não geram dois envios.
export function getSendState(): SendState {
  return state;
}

export function setSendState(next: SendState): void {
  state = next;
  listeners.forEach(listener => listener());
}

export function subscribeToSend(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Esquece a falha e a tentativa: a mesa de que elas falavam não é mais a da tela. */
export function resetSendState(): void {
  setSendState(IDLE);
}

export type CartWrite = 'change' | 'removal';

// Mesa fechada, loja sem v2 e cozinha fechada não dependem da sacola: a api não as confere no PATCH nem no DELETE de
// item, então apagar o aviso deixaria o CTA habilitado diante de uma recusa de pé. A recusa por item some quando a
// sacola perde itens; a de preço, em qualquer escrita, porque o `new_pricing.total` do 409 descreve uma sacola que
// deixou de existir.
const ANSWERED_BY_WRITE: Record<CartWrite, Set<SendFailureKind>> = {
  change: new Set<SendFailureKind>(['price-changed']),
  removal: new Set<SendFailureKind>(['item-unavailable', 'price-changed']),
};

/**
 * Descarta a recusa que a escrita bem-sucedida respondeu (sem tentativa pendente). A falha com tentativa fica: o
 * pedido pode ter entrado.
 */
export function dismissAnsweredFailure(write: CartWrite): void {
  if (state.attempt !== null || state.error === null) {
    return;
  }

  if (!ANSWERED_BY_WRITE[write].has(readSendFailure(state.error).kind)) {
    return;
  }

  setSendState({ ...state, error: null });
}
