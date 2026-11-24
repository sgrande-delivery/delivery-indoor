'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { formatDiscountLabel } from '@/helpers/money';
import { fontFamilies, productDiscountBadgeMetrics, pxToRem } from '@/theme';

export interface ProductDiscountBadgeProps {
  discountPercent: number;
}

// O fundo é a marca a 12% pelo canal: `alpha()` não opera sobre `var()`, que é o que
// `theme.vars.palette` devolve com `cssVariables` ligado.
const Root = styled('span')(({ theme }) => ({
  flexShrink: 0,
  paddingBlock: productDiscountBadgeMetrics.paddingBlock,
  paddingInline: productDiscountBadgeMetrics.paddingInline,
  borderRadius: productDiscountBadgeMetrics.radius,
  backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / ${productDiscountBadgeMetrics.backgroundOpacity})`,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productDiscountBadgeMetrics.fontSize),
  fontWeight: productDiscountBadgeMetrics.fontWeight,
  whiteSpace: 'nowrap',
  color: theme.vars.palette.brand.text,
}));

const ProductDiscountBadge: React.FC<ProductDiscountBadgeProps> = ({ discountPercent }) => {
  return <Root>{formatDiscountLabel(discountPercent)}</Root>;
};

export default ProductDiscountBadge;
