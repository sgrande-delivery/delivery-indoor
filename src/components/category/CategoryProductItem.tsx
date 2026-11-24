'use client';

import React from 'react';
import { pushProductSheet } from '@/components/product/product-route';
import { ProductListItem } from '@/components/ui';
import { resolveRatingDisplay } from '@/helpers/rating';
import { resolveShowcasePrice } from '@/helpers/money';
import { ProductSummary } from '@/types/product';

export interface CategoryProductItemProps {
  product: ProductSummary;
}

/**
 * A linha não tem o `+`: ele abriria o mesmo detalhe que tocar na linha já abre (ver `ProductListItemAddProps`).
 * Sem nota, a linha de avaliação some — nunca "0,0" (RF-18).
 */
const CategoryProductItem: React.FC<CategoryProductItemProps> = ({ product }) => {
  const price = resolveShowcasePrice(product);
  const rating = resolveRatingDisplay(product.rating);

  return (
    <ProductListItem
      size="lg"
      name={product.name}
      description={product.description ?? undefined}
      imageUrl={product.image_url ?? undefined}
      price={price?.current}
      originalPrice={price?.original ?? undefined}
      discountLabel={price?.discountLabel ?? undefined}
      rating={rating ? { value: rating.value, count: `(${rating.count})` } : undefined}
      onOpen={() => pushProductSheet(product.public_id)}
    />
  );
};

export default CategoryProductItem;
