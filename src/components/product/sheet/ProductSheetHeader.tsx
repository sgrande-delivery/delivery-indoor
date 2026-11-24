'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { resolveRatingDisplay } from '@/helpers/rating';
import { fontFamilies, productSheetMetrics, pxToRem } from '@/theme';
import { ProductDetail } from '@/types/product-detail';
import ProductMetaChips from '../ProductMetaChips';
import ProductPriceRow from '../ProductPriceRow';
import { resolveDisplayPrice } from '../display-price';
import ProductRatingLine from '../rating/ProductRatingLine';

export interface ProductSheetHeaderProps {
  detail: ProductDetail;
  // O nome fica no cabeçalho compacto da sobreposição quando não há foto, e aqui quando há — quem
  // sabe qual dos dois é o detalhe, não este componente.
  hasName: boolean;
  // Com foto o selo de desconto vai sobre ela; sem foto, ao lado do preço.
  hasDiscountBadge: boolean;
}

const Root = styled('div')({
  paddingBlockStart: productSheetMetrics.headerPaddingBlockStart,
  paddingInline: productSheetMetrics.headerPaddingInline,
});

const Name = styled('h2')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(productSheetMetrics.nameFontSize),
  fontWeight: productSheetMetrics.nameFontWeight,
  lineHeight: productSheetMetrics.nameLineHeight,
  color: theme.vars.palette.surface.ink,
}));

const Description = styled('p')(({ theme }) => ({
  margin: 0,
  marginBlockStart: productSheetMetrics.descriptionMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productSheetMetrics.descriptionFontSize),
  lineHeight: productSheetMetrics.descriptionLineHeight,
  color: theme.vars.palette.surface.muted,
}));

/**
 * O cabeçalho do produto: nome, nota, descrição, metadados e preço. **Cada elemento é condicional ao
 * próprio dado** — a tela esconde, não reserva espaço. O preço é o do catálogo (`price` e
 * `special_price`, do ambiente mesa); o total da seleção é o do rodapé, que vem do `/price`.
 */
const ProductSheetHeader: React.FC<ProductSheetHeaderProps> = ({ detail, hasName, hasDiscountBadge }) => {
  const { description } = detail;
  const rating = resolveRatingDisplay(detail.rating);
  const displayPrice = resolveDisplayPrice(detail);
  const hasMeta = detail.serves !== null || detail.calories !== null;

  if (!hasName && rating === null && !description && !hasMeta && displayPrice === null) {
    return null;
  }

  return (
    <Root>
      {hasName && <Name>{detail.name}</Name>}
      {rating !== null && <ProductRatingLine rating={rating} />}
      {description && <Description>{description}</Description>}
      <ProductMetaChips serves={detail.serves} calories={detail.calories} />
      {displayPrice !== null && (
        <ProductPriceRow
          currentPrice={displayPrice.current}
          originalPrice={displayPrice.original}
          discountPercent={hasDiscountBadge ? displayPrice.discountPercent : null}
        />
      )}
    </Root>
  );
};

export default ProductSheetHeader;
