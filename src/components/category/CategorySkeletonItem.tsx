'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Skeleton } from '@/components/ui';
import { categoryListMetrics, productListItemSizes } from '@/theme';

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: productListItemSizes.lg.gap,
  padding: productListItemSizes.lg.padding,
  borderRadius: productListItemSizes.lg.radius,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: productListItemSizes.lg.shadow,
}));

const Lines = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
  gap: categoryListMetrics.skeletonBarGap,
});

// O esqueleto tem a forma do item que ele substitui: a foto de 86 e as três barras do desenho.
const CategorySkeletonItem: React.FC = () => {
  return (
    <Root>
      <Skeleton
        width={productListItemSizes.lg.thumbSize}
        height={productListItemSizes.lg.thumbSize}
        radius={productListItemSizes.lg.thumbRadius}
      />
      <Lines>
        {categoryListMetrics.skeletonBars.map(bar => (
          <Skeleton key={bar.height} variant="text" width={bar.width} height={bar.height} />
        ))}
      </Lines>
    </Root>
  );
};

export default CategorySkeletonItem;
