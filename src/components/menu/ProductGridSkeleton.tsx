'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Skeleton } from '@/components/ui';
import { tabletPortraitShellMediaQuery, tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { categoryListMetrics } from '@/theme';
import { productGridMetrics as metrics } from './product-grid-metrics';
import ProductGrid from './ProductGrid';

const LOADING_LABEL = 'Carregando os produtos';
const PLACEHOLDERS = Array.from({ length: metrics.skeletonCards }, (_, index) => index);

// Pinta no primeiro paint, quando ainda não se sabe o formato: some por CSS fora do tablet.
const Root = styled(ProductGrid)({
  display: 'none',
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'grid',
  },
});

const Card = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: categoryListMetrics.skeletonBarGap,
  overflow: 'hidden',
  paddingBlockEnd: metrics.skeletonPaddingBlockEnd,
  borderRadius: metrics.radius,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: metrics.shadow,
}));

const Media = styled(Skeleton)({
  blockSize: metrics.landscape.mediaHeight,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    blockSize: metrics.portrait.mediaHeight,
  },
});

const Lines = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: categoryListMetrics.skeletonBarGap,
  paddingInline: metrics.skeletonPaddingInline,
});

const SkeletonCard: React.FC = () => {
  return (
    <Card>
      <Media width="100%" radius={0} />
      <Lines>
        {categoryListMetrics.skeletonBars.map(bar => (
          <Skeleton key={bar.height} variant="text" width={bar.width} height={bar.height} />
        ))}
      </Lines>
    </Card>
  );
};

const ProductGridSkeleton: React.FC = () => {
  return (
    <Root role="status" aria-busy="true" aria-label={LOADING_LABEL}>
      {PLACEHOLDERS.map(placeholder => (
        <SkeletonCard key={placeholder} />
      ))}
    </Root>
  );
};

export default ProductGridSkeleton;
