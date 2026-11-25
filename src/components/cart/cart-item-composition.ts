import { CartItem, CartItemOption } from '@/types/cart';

const SEPARATOR = ' · ';
const REMOVED_PREFIX = 'sem ';
const QUANTITY_MARK = '×';
const SINGLE = 1;

/**
 * A linha que descreve o que o cliente escolheu e o que tirou, montada só com o payload da sacola: `options[].name`
 * e `removed_ingredients[].name` já vêm resolvidos pelo servidor, e consultar o produto reintroduziria N chamadas ao
 * abrir a sacola e uma segunda verdade sobre o pedido. O payload não diz qual grupo é adicional e qual é tamanho,
 * então não há prefixo `+`.
 *
 * Opção sem nome é omitida, não preenchida: o `name` é anulável quando o item de grupo saiu do cadastro, e um
 * "Opção" genérico seria dado inventado. `quantity > 1` entra como `2× Bacon`, porque esconder o número faria a
 * linha afirmar uma composição que não é a cobrada.
 */
export function buildCartItemComposition(item: CartItem): string | null {
  const options = item.options
    .filter((option): option is CartItemOption & { name: string } => option.name !== null)
    .map(option => (option.quantity > SINGLE ? `${option.quantity}${QUANTITY_MARK} ${option.name}` : option.name));

  const removed = item.removed_ingredients.map(ingredient => `${REMOVED_PREFIX}${ingredient.name}`);
  const parts = [...options, ...removed];

  return parts.length > 0 ? parts.join(SEPARATOR) : null;
}
