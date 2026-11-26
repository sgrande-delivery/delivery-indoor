// Dono único da chave da sacola. `[CART_QUERY_KEY]` é prefixo de `['cart', <id>]`, então as mutações invalidam sem
// saber em qual sacola a tela está.
export const CART_QUERY_KEY = 'cart';

export function cartQueryKey(cartId: string): [string, string] {
  return [CART_QUERY_KEY, cartId];
}

// A chave de toda escrita da sacola: `useIsMutating` com ela é a barreira que vale entre as molduras e o "Limpar", que
// não compartilham o mesmo `useCartActions`.
export const CART_WRITE_MUTATION_KEY = ['cart-write'] as const;

export const CART_CLEAR_MUTATION_KEY = [...CART_WRITE_MUTATION_KEY, 'clear'] as const;
