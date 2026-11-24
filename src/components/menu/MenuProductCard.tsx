'use client';

import React from 'react';
import { pushProductSheet } from '@/components/product/product-route';
import { Badge, ProductCard } from '@/components/ui';
import { resolveShowcasePrice } from '@/helpers/money';
import { ProductCardSizeName } from '@/theme';
import { ProductSummary } from '@/types/product';

export interface MenuProductCardProps {
  product: ProductSummary;
  size?: ProductCardSizeName;
}

/** O card inteiro abre o detalhe; a mesa não tem `+` (RF-13). Preço, riscado e selo são os do servidor (RF-12). */
const MenuProductCard: React.FC<MenuProductCardProps> = ({ product, size = 'md' }) => {
  const price = resolveShowcasePrice(product);
  const hasOffer = Boolean(price?.original);

  return (
    <ProductCard
      size={size}
      name={product.name}
      subtitle={product.description ?? undefined}
      imageUrl={product.image_url ?? undefined}
      price={price?.current}
      originalPrice={price?.original ?? undefined}
      priceTone={hasOffer ? 'offer' : 'default'}
      badge={price?.discountLabel ? <Badge variant="offer">{price.discountLabel}</Badge> : undefined}
      onOpen={() => pushProductSheet(product.public_id)}
    />
  );
};

export default MenuProductCard;
