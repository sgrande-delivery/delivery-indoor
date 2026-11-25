import {
  BoardOptionSelection,
  BoardPayment,
  BoardPaymentMethod,
  BoardProductItem,
  BoardProducts,
  BoardRemovedIngredient,
  BoardRoundStatus,
} from '@/types/board-bill';
import { Image } from '@/types/image';
import { api } from './api';

const ROUND_STATUSES: readonly BoardRoundStatus[] = ['sent', 'preparing', 'ready', 'delivered', 'canceled'];

/** As chaves que o socket, a sacola e o pagamento invalidam. */
export function boardProductsQueryKey(id: string): readonly ['board-products', string] {
  return ['board-products', id];
}

export function boardPaymentsQueryKey(id: string): readonly ['board-payments', string] {
  return ['board-payments', id];
}

/** Um 200 que não é a conta (proxy devolvendo HTML, por exemplo) é falha, não "conta vazia". */
export class InvalidBoardBillResponseError extends Error {
  constructor(route: string) {
    super(`resposta de /boardMovements/{id}/${route} fora do contrato`);
    this.name = 'InvalidBoardBillResponseError';
  }
}

export function isBoardRoundStatus(value: unknown): value is BoardRoundStatus {
  return typeof value === 'string' && (ROUND_STATUSES as readonly string[]).includes(value);
}

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function toOptionSelection(raw: Raw): BoardOptionSelection {
  return {
    option_group_item_id: asNumber(raw.option_group_item_id),
    option_group_id: asNumber(raw.option_group_id),
    name: asString(raw.name) ?? '',
    quantity: asNumber(raw.quantity) ?? 1,
    unit_price: asNumber(raw.unit_price) ?? 0,
    option_group_kind: asString(raw.option_group_kind),
    option_group_name: asString(raw.option_group_name),
  };
}

function toRemovedIngredient(raw: Raw): BoardRemovedIngredient {
  return { public_id: asString(raw.public_id) ?? '', name: asString(raw.name) ?? '' };
}

/** Identidade e dinheiro não têm padrão: um valor com tipo errado é resposta fora do contrato, não "zero". */
function required<T>(value: T | null, route: string): T {
  if (value === null) {
    throw new InvalidBoardBillResponseError(route);
  }

  return value;
}

function toImage(value: unknown): Image | null {
  if (!isRecord(value)) {
    return null;
  }

  const imageUrl = asString(value.imageUrl);

  if (!imageUrl) {
    return null;
  }

  return {
    id: asNumber(value.id) ?? 0,
    imageUrl,
    imageThumbUrl: asString(value.imageThumbUrl),
    selected: value.selected === true,
  };
}

function toList<T>(value: unknown, map: (raw: Raw) => T): T[] {
  return Array.isArray(value) ? value.filter(isRecord).map(map) : [];
}

// o item chega com o `status` cru, o nome do garçom e as relações de complemento: só o que o tipo declara fica no cache
function toProductItem(raw: Raw): BoardProductItem {
  return {
    id: required(asNumber(raw.id), 'products'),
    name: asString(raw.name) ?? '',
    amount: required(asNumber(raw.amount), 'products'),
    price: required(asNumber(raw.price), 'products'),
    final_price: required(asNumber(raw.final_price), 'products'),
    person: asString(raw.person),
    image: toImage(raw.image),
    category_kind: asString(raw.category_kind),
    observations: asString(raw.observations),
    round: asNumber(raw.round) ?? 1,
    order_public_id: required(asString(raw.order_public_id), 'products'),
    round_status: isBoardRoundStatus(raw.round_status) ? raw.round_status : null,
    order_created_at: asString(raw.order_created_at),
    option_selections: toList(raw.option_selections, toOptionSelection),
    removed_ingredients: toList(raw.removed_ingredients, toRemovedIngredient),
  };
}

function toPaymentMethod(value: unknown): BoardPaymentMethod | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: asNumber(value.id) ?? 0,
    method: asString(value.method) ?? '',
    kind: asString(value.kind) ?? '',
    mode: asString(value.mode) ?? '',
  };
}

function toPayment(raw: Raw): BoardPayment {
  return {
    id: required(asString(raw.id), 'payments'),
    value: required(asNumber(raw.value), 'payments'),
    person: asString(raw.person),
    created_at: asString(raw.created_at) ?? '',
    payment_method: toPaymentMethod(raw.payment_method),
  };
}

export async function fetchBoardProducts(id: string): Promise<BoardProducts> {
  const { data } = await api.get<unknown>(`/boardMovements/${encodeURIComponent(id)}/products`);

  if (!isRecord(data) || !Array.isArray(data.products)) {
    throw new InvalidBoardBillResponseError('products');
  }

  return { products: data.products.filter(isRecord).map(toProductItem) };
}

export async function fetchBoardPayments(id: string): Promise<BoardPayment[]> {
  const { data } = await api.get<unknown>(`/boardMovements/${encodeURIComponent(id)}/payments`);

  if (!Array.isArray(data)) {
    throw new InvalidBoardBillResponseError('payments');
  }

  return data.filter(isRecord).map(toPayment);
}
