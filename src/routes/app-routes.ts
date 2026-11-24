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
