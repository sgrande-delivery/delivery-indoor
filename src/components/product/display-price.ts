import { hasVisibleDiscount } from '@/helpers/money';
import { ProductDetail } from '@/types/product-detail';

export interface DisplayPrice {
  current: number;
  original: number | null;
  /** O selo `-N%`; `null` quando o percentual arredondado não tem o que anunciar. */
  discountPercent: number | null;
}

/**
 * O par de preços do cabeçalho, do jeito que o servidor mandou (centavos, ambiente mesa).
 *
 * **Zero não é preço, é ausência de preço.** Produto que depende de escolha chega com `price: 0` e o
 * `/price` responde 422 até a seleção fechar; desenhar "R$ 0,00" afirmaria gratuidade que ninguém
 * informou. O mesmo vale para `special_price: 0`: o preço vigente cai fora e a linha some.
 *
 * O selo passa pelo `hasVisibleDiscount`, e não pelo `!== null`: o percentual chega arredondado, e um
 * desconto de centavo anunciaria `-0%`.
 */
export function resolveDisplayPrice(
  detail: Pick<ProductDetail, 'price' | 'special_price' | 'discount_percent'>
): DisplayPrice | null {
  const { price, special_price: specialPrice, discount_percent: discountPercent } = detail;
  const current = specialPrice ?? price;

  if (current === null || current <= 0) {
    return null;
  }

  if (specialPrice === null || price === null || price <= 0) {
    return { current, original: null, discountPercent: null };
  }

  return { current, original: price, discountPercent: hasVisibleDiscount(discountPercent) ? discountPercent : null };
}
