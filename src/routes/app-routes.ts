/** A home do cardápio e a entrada do QR da mesa. */
export const HOME_ROUTE = '/';

/** A árvore da categoria: `/menu?category=<id>`. */
export const MENU_ROUTE = '/menu';

/** O parâmetro que a listagem da categoria lê; quem monta a URL é `categoryRouteHref`. */
export const CATEGORY_SEARCH_PARAM = 'category';

export function categoryRouteHref(categoryId: number): string {
  return `${MENU_ROUTE}?${CATEGORY_SEARCH_PARAM}=${categoryId}`;
}

export const SEARCH_ROUTE = '/search';

export const CART_ROUTE = '/cart';

/** A conta da mesa. */
export const BOARD_ROUTE = '/board';

/** O fluxo de pagamento da conta, da frente #24. */
export const BOARD_PAYMENT_ROUTE = '/board/payment';

/** Lê o `?category=`: inteiro positivo, ou `null` (ausente, repetido, `0`, `abc`, `1.5`). */
export function parseCategoryId(raw: string | string[] | undefined): number | null {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) {
    return null;
  }

  const id = Number(raw);

  return Number.isSafeInteger(id) ? id : null;
}
