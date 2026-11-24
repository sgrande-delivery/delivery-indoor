'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { formatCents } from '@/helpers/money';
import { fontFamilies, productSheetMetrics, pxToRem } from '@/theme';
import ProductDiscountBadge from './ProductDiscountBadge';

export interface ProductPriceRowProps {
  currentPrice: number;
  originalPrice: number | null;
  // O selo ao lado do preço, quando não há foto para recebê-lo.
  discountPercent: number | null;
}

const Root = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  gap: productSheetMetrics.priceGap,
  marginBlockStart: productSheetMetrics.priceMarginBlockStart,
});

const OriginalPrice = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productSheetMetrics.originalPriceFontSize),
  textDecoration: 'line-through',
  color: theme.vars.palette.surface.muted,
}));

const CurrentPrice = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(productSheetMetrics.priceFontSize),
  fontWeight: productSheetMetrics.priceFontWeight,
  lineHeight: productSheetMetrics.priceLineHeight,
  color: theme.vars.palette.surface.ink,
}));

/**
 * Os valores são os que o servidor resolveu (`price` e `special_price`, em centavos): nada aqui
 * compara nem calcula desconto. O riscado e o selo têm portões diferentes e podem discordar — um
 * desconto de centavo desenha o riscado e nenhum selo, e está certo.
 */
const ProductPriceRow: React.FC<ProductPriceRowProps> = ({ currentPrice, originalPrice, discountPercent }) => {
  return (
    <Root>
      {/* Dois valores em sequência lidos em voz alta não dizem qual é qual, e o desconto já está na
          pastilha — o riscado é reforço visual. */}
      {originalPrice !== null && <OriginalPrice aria-hidden>{formatCents(originalPrice)}</OriginalPrice>}
      <CurrentPrice>{formatCents(currentPrice)}</CurrentPrice>
      {discountPercent !== null && <ProductDiscountBadge discountPercent={discountPercent} />}
    </Root>
  );
};

export default ProductPriceRow;
