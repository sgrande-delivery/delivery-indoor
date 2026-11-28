import { AxiosRequestConfig, isAxiosError } from 'axios';
import { randomUuid } from '@/helpers/random-uuid';
import { Cart, CheckoutPriceChangedBody } from '@/types/cart';
import { PlacedOrder } from '@/types/order';
import { ProductSelection } from '@/types/product-selection';
import { api } from './api';
import { ApiResponseError } from './api-error-interceptor';

const CART_STORAGE_KEY = 'indoor:cart';
const CART_SESSION_TOKEN_HEADER = 'x-cart-session-token';
const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
const SERVER_ERROR_STATUS = 500;
const CONFLICT_STATUS = 409;
const IDEMPOTENCY_IN_FLIGHT_CODE = 'idempotency_key_in_flight';
/** O envio de mesa: o pedido entra na conta da mesa, sem endereço, frete ou pagamento. */
export const BOARD_SHIPMENT_METHOD = 'board';
const NOT_FOUND_STATUS = 404;
const UNPROCESSABLE_STATUS = 422;
const CART_NOT_FOUND_CODE = 'cart_not_found';
const CART_ITEM_NOT_FOUND_CODE = 'cart_item_not_found';
const CART_ALREADY_CHECKED_OUT_CODE = 'cart_already_checked_out';
const ITEM_REJECTION_STATUSES = [NOT_FOUND_STATUS, UNPROCESSABLE_STATUS];
const CART_FAILURE_CODES = [CART_NOT_FOUND_CODE, CART_ITEM_NOT_FOUND_CODE, CART_ALREADY_CHECKED_OUT_CODE];

/** O que o aparelho guarda: a sacola só vale para a movimentação em que nasceu. */
export interface StoredCart {
  id: string;
  sessionToken: string;
  movementId: string;
}

type StoredCartListener = () => void;

const storedCartListeners = new Set<StoredCartListener>();

function notifyStoredCartChanged(): void {
  storedCartListeners.forEach(listener => listener());
}

// O id guardado muda fora do React (`ensureCart` cria a sacola de dentro de uma mutação), então quem o lê por
// `useSyncExternalStore` precisa ser avisado.
export function subscribeToStoredCart(listener: StoredCartListener): () => void {
  storedCartListeners.add(listener);

  return () => {
    storedCartListeners.delete(listener);
  };
}

function isStoredCart(value: unknown): value is StoredCart {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.sessionToken === 'string' &&
    typeof candidate.movementId === 'string'
  );
}

function parseStoredCart(raw: string): StoredCart | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    return isStoredCart(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Espelho do que foi gravado: com o storage negado (navegação privada), a sacola e o token ainda valem nesta aba, e
// sem eles o `POST /items` sairia sem `x-cart-session-token` e voltaria 404.
let memoryStoredCart: string | null = null;

function readRawStoredCart(): string | null {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY) ?? memoryStoredCart;
  } catch {
    return memoryStoredCart;
  }
}

function writeRawStoredCart(value: string | null): void {
  memoryStoredCart = value;

  try {
    if (value === null) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CART_STORAGE_KEY, value);
    }
  } catch {
    // sem storage, vale o espelho em memória até o reload
  }
}

function forgetStoredCart(): void {
  writeRawStoredCart(null);
  notifyStoredCartChanged();
}

export function clearStoredCart(): void {
  forgetStoredCart();
}

/** Esquece só se a guardada ainda é esta: a falha de uma tentativa antiga não apaga a sacola que veio depois. */
export function forgetStoredCartIf(cartId: string): void {
  if (peekStoredCart()?.id === cartId) {
    forgetStoredCart();
  }
}

function storeCart(stored: StoredCart): void {
  writeRawStoredCart(JSON.stringify(stored));
  notifyStoredCartChanged();
}

function peekStoredCart(): StoredCart | null {
  const raw = readRawStoredCart();

  return raw === null ? null : parseStoredCart(raw);
}

// Lê e descarta o valor que não tem o shape: quem chama é uma mutação, nunca o render.
function readStoredCart(): StoredCart | null {
  const raw = readRawStoredCart();

  if (raw === null) {
    return null;
  }

  const stored = parseStoredCart(raw);

  if (stored === null) {
    forgetStoredCart();
  }

  return stored;
}

/**
 * Snapshot do `useSyncExternalStore`, chamado a cada render: lê e não escreve. A sacola guardada para outra
 * movimentação não é desta mesa, e devolve `null`.
 */
export function readStoredCartIdFor(movementId: string | null): string | null {
  const stored = peekStoredCart();

  return stored !== null && stored.movementId === movementId ? stored.id : null;
}

export function readStoredCartSessionToken(cartId: string): string | undefined {
  const stored = peekStoredCart();

  return stored !== null && stored.id === cartId ? stored.sessionToken : undefined;
}

function cartRequestConfig(sessionToken: string | undefined = peekStoredCart()?.sessionToken): AxiosRequestConfig {
  return sessionToken === undefined ? {} : { headers: { [CART_SESSION_TOKEN_HEADER]: sessionToken } };
}

export async function fetchCart(cartId: string): Promise<Cart> {
  const response = await api.get<Cart>(`/cart/${cartId}`, cartRequestConfig());

  return response.data;
}

// O 404 de `x-restaurant-id` faltando não traz `internal_code`, e os ramos que dependem deste predicado apagam o
// storage: ler só o status confundiria os dois.
export function isCartNotFound(error: unknown): boolean {
  if (!isAxiosError<ApiResponseError>(error)) {
    return false;
  }

  return error.response?.status === NOT_FOUND_STATUS && error.response.data?.internal_code === CART_NOT_FOUND_CODE;
}

/**
 * O `PATCH` e o `DELETE` de item respondem `cart_item_not_found` quando a sacola é de outro token ou o item sumiu, e
 * não `cart_not_found`: quem escreve trata os dois do mesmo jeito, relendo a sacola.
 */
export function isCartItemNotFound(error: unknown): boolean {
  if (!isAxiosError<ApiResponseError>(error)) {
    return false;
  }

  return error.response?.status === NOT_FOUND_STATUS && error.response.data?.internal_code === CART_ITEM_NOT_FOUND_CODE;
}

export function isCartAlreadyCheckedOut(error: unknown): boolean {
  if (!isAxiosError<ApiResponseError>(error)) {
    return false;
  }

  return (
    error.response?.status === UNPROCESSABLE_STATUS &&
    error.response.data?.internal_code === CART_ALREADY_CHECKED_OUT_CODE
  );
}

/**
 * O servidor recusou **este item**, e o resto da sacola continua de pé. Lê o corpo e não só o status: o produto
 * fora do cardápio é 404 (`product_not_found_for_cart`) e a composição inválida é 422, e os dois códigos de sacola
 * (`cart_not_found`, `cart_already_checked_out`) chegam nos mesmos status sem falar do item. Sem `internal_code` não
 * é a API falando (gateway, 401, 500).
 */
export function isCartItemRejected(error: unknown): boolean {
  if (!isAxiosError<ApiResponseError>(error) || !error.response) {
    return false;
  }

  const code = error.response.data?.internal_code;

  if (!code || CART_FAILURE_CODES.includes(code)) {
    return false;
  }

  return ITEM_REJECTION_STATUSES.includes(error.response.status);
}

const UNAVAILABLE_MESSAGE_CODES = ['product_unavailable', 'option_item_unavailable'];
const PRICE_CHANGED_CODE = 'checkout_price_changed';

/**
 * O `message` da api só chega à tela quando é copy para o cliente: `product_unavailable` e `option_item_unavailable`
 * ("<nome> não está disponível agora."). Os outros códigos de recusa vêm técnicos e em inglês ("Option group item 45
 * not found.").
 */
export function readUnavailableMessage(error: unknown): string | null {
  if (!isAxiosError<ApiResponseError>(error)) {
    return null;
  }

  const code = error.response?.data?.internal_code;

  if (code === undefined || !UNAVAILABLE_MESSAGE_CODES.includes(code)) {
    return null;
  }

  const message = error.response?.data?.message;

  return typeof message === 'string' && message.trim() !== '' ? message : null;
}

/** O que a tela diz do `409 checkout_price_changed`, em centavos. */
export interface PriceChange {
  previousTotal: number;
  newTotal: number;
  stalePromotionNames: string[];
}

function isCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Lê o 409 de preço. Sem `previous_total` e `new_pricing.total` numéricos devolve `null`: a tela não tem o que mostrar,
 * e "R$ NaN" é pior que a falha genérica. O total novo vem daqui, e não da sacola relida: quando o preço do produto
 * mudou, o `GET /cart` segue com o total antigo.
 */
export function readPriceChange(error: unknown): PriceChange | null {
  if (!isAxiosError<ApiResponseError>(error) || error.response?.data?.internal_code !== PRICE_CHANGED_CODE) {
    return null;
  }

  const body: unknown = error.response.data;
  const {
    previous_total: previousTotal,
    new_pricing: pricing,
    stale_promotions: stale,
  } = body as Partial<Record<keyof CheckoutPriceChangedBody, unknown>>;
  const newTotal =
    typeof pricing === 'object' && pricing !== null
      ? (pricing as Partial<Record<keyof CheckoutPriceChangedBody['new_pricing'], unknown>>).total
      : undefined;

  if (!isCents(previousTotal) || !isCents(newTotal)) {
    return null;
  }

  const names = (Array.isArray(stale) ? stale : [])
    .map((promotion: unknown) => (promotion as { name?: unknown } | null)?.name)
    .filter((name): name is string => typeof name === 'string' && name.trim() !== '');

  return { previousTotal, newTotal, stalePromotionNames: [...new Set(names)] };
}

export function isCartUsable(cart: Cart): boolean {
  if (cart.status !== 'open') {
    return false;
  }

  return cart.expires_at === null || Date.parse(cart.expires_at) > Date.now();
}

async function isStoredCartUsable(cartId: string): Promise<boolean> {
  try {
    return isCartUsable(await fetchCart(cartId));
  } catch (error) {
    if (isCartNotFound(error)) {
      return false;
    }

    throw error;
  }
}

async function createCart(movementId: string): Promise<StoredCart> {
  const sessionToken = randomUuid();
  const response = await api.post<Cart>('/cart', { board_movement_id: movementId }, cartRequestConfig(sessionToken));
  const stored: StoredCart = {
    id: response.data.id,
    sessionToken: response.data.session_token ?? sessionToken,
    movementId,
  };

  storeCart(stored);

  return stored;
}

async function resolveCart(movementId: string): Promise<StoredCart> {
  const stored = readStoredCart();

  if (stored !== null && stored.movementId === movementId && (await isStoredCartUsable(stored.id))) {
    return stored;
  }

  if (stored !== null) {
    forgetStoredCart();
  }

  return createCart(movementId);
}

let ensureInFlight: { movementId: string; promise: Promise<StoredCart> } | null = null;

/**
 * Uma criação por vez: dois toques em adicionar antes da primeira resposta fariam dois `POST /cart`, e o item do
 * primeiro iria para uma sacola órfã.
 */
export function ensureCart(movementId: string): Promise<StoredCart> {
  if (ensureInFlight !== null && ensureInFlight.movementId === movementId) {
    return ensureInFlight.promise;
  }

  const promise = resolveCart(movementId).finally(() => {
    if (ensureInFlight?.promise === promise) {
      ensureInFlight = null;
    }
  });

  ensureInFlight = { movementId, promise };

  return promise;
}

// Sacola que o servidor não tem mais deixa de ser deste aparelho aqui, e `null` é "não há sacola". Quem recria é
// `ensureCart`, na próxima adição.
export async function fetchStoredCart(cartId: string): Promise<Cart | null> {
  try {
    return await fetchCart(cartId);
  } catch (error) {
    if (!isCartNotFound(error)) {
      throw error;
    }

    if (peekStoredCart()?.id === cartId) {
      forgetStoredCart();
    }

    return null;
  }
}

// Responde a sacola inteira (201), não o item criado.
export async function addCartItem(cartId: string, selection: ProductSelection): Promise<Cart> {
  const response = await api.post<Cart>(`/cart/${cartId}/items`, selection, cartRequestConfig());

  return response.data;
}

// O `PATCH` é parcial: só `{ quantity }` preserva `notes`, `option_selections` e `removed_ingredients`.
export async function updateCartItemQuantity(itemId: number, quantity: number): Promise<Cart> {
  const response = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity }, cartRequestConfig());

  return response.data;
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const response = await api.delete<Cart>(`/cart/items/${itemId}`, cartRequestConfig());

  return response.data;
}

/**
 * O único lugar que monta o corpo do envio: nenhum campo de entrega, pagamento, agendamento ou observação se aplica à
 * mesa. A resposta é o pedido criado (201), e a conta da mesa o recebe pelo `board_movement_id` do carrinho.
 */
export async function checkoutCart(
  cartId: string,
  customerName: string,
  idempotencyKey: string,
  sessionToken?: string,
  options: { acceptPriceChange?: boolean } = {}
): Promise<PlacedOrder> {
  const config = cartRequestConfig(sessionToken);
  const response = await api.post<PlacedOrder>(
    `/cart/${cartId}/checkout`,
    {
      customer_name: customerName,
      shipment_method: BOARD_SHIPMENT_METHOD,
      ...(options.acceptPriceChange && { accept_price_change: true }),
    },
    { ...config, headers: { ...config.headers, [IDEMPOTENCY_KEY_HEADER]: idempotencyKey } }
  );

  return response.data;
}

/**
 * O servidor grava a resposta 2xx e 4xx da chave e a repete: reenviar com ela depois de um 4xx devolveria o mesmo 4xx
 * para sempre. A chave só se repete quando o pedido pode ter entrado sem o app saber: sem resposta, 5xx (que o
 * servidor não grava) ou a primeira tentativa ainda em voo.
 */
export function isIdempotencyKeyReusable(error: unknown): boolean {
  if (!isAxiosError<ApiResponseError>(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  const { status, data } = error.response;

  return (
    status >= SERVER_ERROR_STATUS || (status === CONFLICT_STATUS && data?.internal_code === IDEMPOTENCY_IN_FLIGHT_CODE)
  );
}
