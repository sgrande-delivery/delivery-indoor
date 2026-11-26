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

// Só a recusa por item muda com a sacola. Mesa fechada, loja sem v2 e cozinha fechada não dependem dela: a api não as
// confere no PATCH nem no DELETE de item, então apagar o aviso deixaria o CTA habilitado diante de uma recusa de pé.
const ANSWERED_BY_CART_WRITE = new Set<SendFailureKind>(['item-unavailable']);

/**
 * Descarta a recusa por item (sem tentativa pendente) quando a sacola perde itens. A falha com tentativa fica: o pedido
 * pode ter entrado.
 */
export function dismissAnsweredFailure(): void {
  if (state.attempt !== null || state.error === null) {
    return;
  }

  if (!ANSWERED_BY_CART_WRITE.has(readSendFailure(state.error).kind)) {
    return;
  }

  setSendState({ ...state, error: null });
}
