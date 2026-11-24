'use client';

import React from 'react';
import { pushProductSheet } from '@/components/product/product-route';
import { ProductListItem } from '@/components/ui';
import { findHighlightRanges } from '@/helpers/highlight';
import { resolveShowcasePrice } from '@/helpers/money';
import { resolveRatingDisplay } from '@/helpers/rating';
import { ProductSummary } from '@/types/product';

const MATCHED_SEPARATOR = ' · ';

export interface SearchProductItemProps {
  product: ProductSummary;
  term: string | null;
}

/**
 * O destaque é só marcação sobre o que o servidor devolveu: o termo no nome (o `<mark>`) e, quando o produto casou por
 * opção, o `matched_option` no lugar da descrição, com o item em negrito `success`. A linha `lg` tem uma linha de
 * descrição e nenhum slot para a extra do card de grade (06); o primitivo não muda.
 */
const SearchProductItem: React.FC<SearchProductItemProps> = ({ product, term }) => {
  const price = resolveShowcasePrice(product);
  const rating = resolveRatingDisplay(product.rating);
  const matched = product.matched_option;

  const description = matched
    ? `${matched.group_name}${MATCHED_SEPARATOR}${matched.item_name}`
    : (product.description ?? undefined);
  const descriptionStart = matched ? matched.group_name.length + MATCHED_SEPARATOR.length : 0;

  return (
    <ProductListItem
      size="lg"
      name={product.name}
      description={description}
      highlights={{
        name: term === null ? undefined : findHighlightRanges(product.name, [term]),
        description: matched
          ? [{ start: descriptionStart, end: descriptionStart + matched.item_name.length }]
          : undefined,
      }}
      imageUrl={product.image_url ?? undefined}
      price={price?.current}
      originalPrice={price?.original ?? undefined}
      discountLabel={price?.discountLabel ?? undefined}
      rating={rating ? { value: rating.value, count: `(${rating.count})` } : undefined}
      onOpen={() => pushProductSheet(product.public_id)}
    />
  );
};

export default SearchProductItem;
