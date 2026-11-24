import { ProductSummary } from '@/types/product';

// Todo valor monetário do catálogo e do carrinho v2 chega em centavos (inteiro). O `moneyFormat` de
// `src/helpers/numberFormat.js` espera reais e serve a conta da mesa (contrato v1) — os dois coexistem
// de propósito, e adaptar um deles em silêncio trocaria a unidade sem ninguém ver.
const CENTS_IN_UNIT = 100;

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// A divisão é só conversão de unidade para exibição: o app não deriva nem soma preço, quem calcula é o
// servidor.
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / CENTS_IN_UNIT);
}

const plainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** O valor sem o símbolo (`38,80`), para quem desenha o `R$` à parte. */
export function formatCentsPlain(cents: number): string {
  return plainFormatter.format(cents / CENTS_IN_UNIT);
}

/**
 * O rótulo do desconto numa fonte só — `-14%`. São quatro telas desenhando o mesmo selo (o card da
 * trilha `Ofertas`, a pastilha do modal de produto, o card das trilhas da home e o item de lista da
 * categoria e da busca), e o sinal, a posição dele e o `%` não são decisão de cada uma.
 */
export function formatDiscountLabel(discountPercent: number): string {
  return `-${discountPercent}%`;
}

export interface ShowcasePrice {
  current: string;
  original: string | null;
  discountLabel: string | null;
}

/**
 * O que a vitrine mostra de preço a partir de um `ProductSummary`: o promocional quando existe, o
 * cheio quando não, **nada** quando o servidor não resolveu o valor — e, havendo promoção, o preço
 * antigo para o riscado e o `-14%` para o selo.
 *
 * `price: 0` não é "de graça" — é a projeção dizendo que não resolveu o preço, o que acontece no
 * `buildable`, cujo valor sai do tamanho escolhido, e em produto sem preço cadastrado. `R$ 0,00`
 * num card seria informação falsa, então o elemento some e quem abre o detalhe vê o valor real.
 *
 * Mora aqui, e não em cada tela, porque a regra é a mesma no card da home, no item da categoria e
 * no resultado da busca — três cópias da mesma condição é como uma delas envelhece sozinha.
 *
 * **O riscado e o selo têm portões diferentes, e podem discordar.** O riscado sai de haver dois valores, com o promocional **menor** que
 * o cheio; o selo passa ainda pelo `hasVisibleDiscount`, que recusa o percentual arredondado para
 * zero. Um desconto de centavo — R$ 16,00 para R$ 15,99 — desenha o riscado e **nenhum** selo:
 * o preço caiu mesmo, e é o percentual que não tem o que dizer.

 */
export function resolveShowcasePrice(
  product: Pick<ProductSummary, 'price' | 'special_price' | 'discount_percent'>
): ShowcasePrice | null {
  const { price, special_price: specialPrice, discount_percent: discountPercent } = product;
  const current = specialPrice ?? price;

  if (current === null || current <= 0) {
    return null;
  }

  const hasOffer = specialPrice !== null && price !== null && specialPrice < price;

  return {
    current: formatCents(current),
    original: hasOffer ? formatCents(price) : null,
    discountLabel: hasOffer && hasVisibleDiscount(discountPercent) ? formatDiscountLabel(discountPercent) : null,
  };
}

/**
 * O desconto vale ser anunciado: *condicional de existência é sobre o valor, não sobre o `null`* —
 * a mesma forma do `price: 0` acima.
 *
 * `discount_percent` chega **arredondado** do servidor, então uma diferença real mas pequena — R$ 16,00
 * para R$ 15,99, que é 0,0625% — vira **0**. Um gate `!== null` deixa passar, e a tela desenha `-0%`:
 * um selo de oferta anunciando desconto nenhum.
 *
 * **`null` e `0` têm o mesmo desfecho de propósito**, e é isso que este predicado existe para dizer num
 * lugar só: os dois significam "não há o que anunciar". Negativo cai junto, porque `-1%` no selo seria
 * pior que nada — mas isso é **defesa, não estado observado**: o `resolveSpecialPriceCents` da
 * `delivery-api` recusa `special_price` que não seja estritamente menor que o `price`, então o
 * servidor não produz negativo hoje.
 *
 * **O que ele esconde é só a faixa que arredonda para zero**, abaixo de 0,5%. R$ 16,00 para R$ 15,90
 * é 0,625%, chega como `1`, e o selo `-1%` continua aparecendo — de propósito.
 *
 * É **type predicate** e não `boolean`: quem passa por ele fica com `number`, e o consumidor não
 * precisa repetir o `!== null` só para o `tsc` concordar — repetição que divergiria do predicado no
 * dia em que a regra mudasse.
 */
export function hasVisibleDiscount(discountPercent: number | null): discountPercent is number {
  return discountPercent !== null && discountPercent > 0;
}
