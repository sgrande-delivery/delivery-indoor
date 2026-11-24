'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Skeleton } from '@/components/ui';
import { productSheetMetrics, productSheetSkeletonMetrics } from '@/theme';

const LOADING_LABEL = 'Carregando o produto';
const BLOCK_PLACEHOLDERS = [0, 1];

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: productSheetSkeletonMetrics.gap,
  paddingBlockEnd: productSheetSkeletonMetrics.paddingBlock,
});

const Body = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: productSheetSkeletonMetrics.gap,
  paddingInline: productSheetSkeletonMetrics.paddingInline,
});

const ProductSheetSkeleton: React.FC = () => {
  return (
    <Root aria-busy="true" aria-label={LOADING_LABEL} role="status">
      <Skeleton height={productSheetMetrics.mediaHeight} radius={0} />
      <Body>
        <Skeleton width={productSheetSkeletonMetrics.nameWidth} height={productSheetSkeletonMetrics.nameHeight} />
        <Skeleton width={productSheetSkeletonMetrics.priceWidth} height={productSheetSkeletonMetrics.priceHeight} />
        {BLOCK_PLACEHOLDERS.map(placeholder => (
          <Skeleton key={placeholder} height={productSheetSkeletonMetrics.blockHeight} />
        ))}
      </Body>
    </Root>
  );
};

export default ProductSheetSkeleton;
