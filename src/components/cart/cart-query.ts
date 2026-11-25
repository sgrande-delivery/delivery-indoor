// Dono único da chave da sacola. `[CART_QUERY_KEY]` é prefixo de `['cart', <id>]`, então as mutações invalidam sem
// saber em qual sacola a tela está.
export const CART_QUERY_KEY = 'cart';

export function cartQueryKey(cartId: string): [string, string] {
  return [CART_QUERY_KEY, cartId];
}
