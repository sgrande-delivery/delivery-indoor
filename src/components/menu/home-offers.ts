import { hasVisibleDiscount } from '@/helpers/money';
import { ProductSummary } from '@/types/product';

// A trilha rola na horizontal; oito é o que sustenta a rolagem sem virar catálogo. O servidor corta por `limit`.
export const HOME_OFFERS_LIMIT = 8;

export interface HomeOffer {
  publicId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
}

/**
 * Descarta o que não tem promoção visível. O percentual zero tira o produto da vitrine, e não só o selo: o preço
 * riscado do `OfferCard` é `aria-hidden`, então o selo é quem carrega a oferta. Ordem e corte são do servidor
 * (`sort=discount_desc`, `limit`); nada aqui deriva desconto.
 */
export function toOffer(product: ProductSummary): HomeOffer | null {
  const { price, special_price: specialPrice, discount_percent: discountPercent } = product;

  if (!product.activated || price === null || specialPrice === null || !hasVisibleDiscount(discountPercent)) {
    return null;
  }

  return {
    publicId: product.public_id,
    name: product.name,
    description: product.description,
    imageUrl: product.image_url,
    originalPrice: price,
    currentPrice: specialPrice,
    discountPercent,
  };
}

export function selectHomeOffers(products: ProductSummary[]): HomeOffer[] {
  return products.map(toOffer).filter((offer): offer is HomeOffer => offer !== null);
}
