import { isAxiosError } from 'axios';
import { ApiResponseError, readErrorCode } from '@/services/api-error-interceptor';
import { formatCents } from '@/helpers/money';
import { PriceChange, readPriceChange, readUnavailableMessage } from '@/services/cart';
import { resolveErrorCode } from '@/services/http-error-code';

export type SendFailureKind =
  | 'table-closed'
  | 'kitchen-closed'
  | 'item-unavailable'
  | 'price-changed'
  | 'orders-disabled'
  | 'already-sent'
  | 'cart-expired'
  | 'in-flight'
  | 'network'
  | 'unknown';

export type SendFailureAction = 'retry' | 'read-qr' | 'see-bill' | 'accept-price';

export interface SendFailure {
  kind: SendFailureKind;
  message: string;
  /** O que o cliente diz ao garçom (`erro de rede`, `erro 500`). `null` na recusa conhecida, com mensagem própria. */
  code: string | null;
  action: SendFailureAction | null;
  /** Só em `price-changed`: o total que o cliente aceita, em centavos. A sacola relida não o traz. */
  newTotal: number | null;
  /** Só em `price-changed`: as promoções que caíram, uma frase por promoção. */
  details: string[];
}

export const TABLE_CLOSED_MESSAGE = 'Esta mesa foi fechada no caixa. Para pedir de novo, leia o QR code da mesa.';
export const KITCHEN_CLOSED_MESSAGE = 'A cozinha está fechada agora. Sua sacola fica guardada para quando ela abrir.';
export const ALREADY_SENT_MESSAGE = 'Este pedido já foi enviado. Confira na conta da mesa.';
export const CART_EXPIRED_MESSAGE = 'Sua sacola expirou. Monte o pedido de novo.';

const SERVER_ERROR_STATUS = 500;
const REMOVE_ITEM_HINT = 'Remova o item para enviar o resto.';

const MESSAGES: Record<SendFailureKind, string> = {
  'table-closed': TABLE_CLOSED_MESSAGE,
  'kitchen-closed': KITCHEN_CLOSED_MESSAGE,
  'price-changed': 'O valor do pedido mudou.',
  'item-unavailable': `Um item da sacola não está disponível agora. ${REMOVE_ITEM_HINT}`,
  'orders-disabled': 'Os pedidos pelo app ainda não estão disponíveis nesta loja. Chame o garçom para pedir.',
  'already-sent': ALREADY_SENT_MESSAGE,
  'cart-expired': CART_EXPIRED_MESSAGE,
  'in-flight': 'O pedido ainda está sendo enviado. Aguarde um instante.',
  network: 'Não foi possível enviar o pedido. Verifique a conexão e tente de novo.',
  unknown: 'Não foi possível enviar o pedido.',
};

const ACTIONS: Record<SendFailureKind, SendFailureAction | null> = {
  'table-closed': 'read-qr',
  'kitchen-closed': null,
  'item-unavailable': null,
  'price-changed': 'accept-price',
  'orders-disabled': null,
  'already-sent': 'see-bill',
  'cart-expired': null,
  'in-flight': 'retry',
  network: 'retry',
  unknown: 'retry',
};

// O status nunca decide sozinho: o 404 de restaurante errado não traz `internal_code`. `restaurant_closed` fica de fora
// de propósito: é recusa de entrega, e o pedido de mesa não a recebe.
const KINDS_BY_CODE = new Map<string, SendFailureKind>(
  Object.entries({
    board_movement_not_found_for_cart: 'table-closed',
    board_movement_freed: 'table-closed',
    board_movement_closed: 'table-closed',
    kitchen_closed: 'kitchen-closed',
    product_unavailable: 'item-unavailable',
    product_not_found_for_cart: 'item-unavailable',
    option_item_unavailable: 'item-unavailable',
    checkout_price_changed: 'price-changed',
    v2_orders_disabled: 'orders-disabled',
    cart_already_checked_out: 'already-sent',
    cart_not_found: 'cart-expired',
    cart_item_not_found: 'cart-expired',
    idempotency_key_in_flight: 'in-flight',
  } satisfies Record<string, SendFailureKind>)
);

// A recusa com mensagem própria já diz ao cliente o que fazer; o código técnico só entra na falha que a mensagem não
// explica (decisão do dev, 2026-11-26). A tabela é exaustiva: um `kind` novo obriga a decidir.
const SHOWS_CODE: Record<SendFailureKind, boolean> = {
  'table-closed': false,
  'kitchen-closed': false,
  'item-unavailable': false,
  'price-changed': false,
  'orders-disabled': false,
  'already-sent': false,
  'cart-expired': false,
  'in-flight': false,
  network: true,
  unknown: true,
};

function readResponseCode(error: unknown): string | undefined {
  return isAxiosError<ApiResponseError>(error) ? readErrorCode(error.response?.data) : undefined;
}

function resolveKind(error: unknown): SendFailureKind {
  if (!isAxiosError<ApiResponseError>(error)) {
    return 'unknown';
  }

  if (!error.response || error.response.status >= SERVER_ERROR_STATUS) {
    return 'network';
  }

  const code = readResponseCode(error);
  const kind = (code !== undefined && KINDS_BY_CODE.get(code)) || 'unknown';

  // sem os totais a tela não tem o que mostrar: a falha genérica, com código, é melhor que "R$ NaN"
  return kind === 'price-changed' && readPriceChange(error) === null ? 'unknown' : kind;
}

function resolveMessage(kind: SendFailureKind, error: unknown, priceChange: PriceChange | null): string {
  if (priceChange !== null) {
    return `O valor do pedido mudou: de ${formatCents(priceChange.previousTotal)} para ${formatCents(priceChange.newTotal)}.`;
  }

  if (kind !== 'item-unavailable') {
    return MESSAGES[kind];
  }

  // o `message` da api só passa no `product_unavailable` e no `option_item_unavailable`, com copy de cliente
  const unavailable = readUnavailableMessage(error);

  return unavailable === null ? MESSAGES[kind] : `${unavailable} ${REMOVE_ITEM_HINT}`;
}

export function readSendFailure(error: unknown): SendFailure {
  const kind = resolveKind(error);
  const priceChange = kind === 'price-changed' ? readPriceChange(error) : null;

  return {
    kind,
    message: resolveMessage(kind, error, priceChange),
    code: SHOWS_CODE[kind] ? resolveErrorCode(error) : null,
    action: ACTIONS[kind],
    newTotal: priceChange?.newTotal ?? null,
    details: priceChange?.stalePromotionNames.map(name => `A promoção ${name} acabou.`) ?? [],
  };
}

/** A mesa que a recusa de movimentação descreve, também no `POST /cart` da adição. */
export function isTableClosedError(error: unknown): boolean {
  return resolveKind(error) === 'table-closed';
}
