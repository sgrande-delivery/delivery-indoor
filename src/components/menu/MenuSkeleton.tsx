'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Skeleton } from '@/components/ui';
import { categoryRailMetrics, controlSizes } from '@/theme';
import HomeRailSkeleton from './HomeRailSkeleton';

const LOADING_LABEL = 'Carregando o cardápio';
const CHIP_WIDTHS = [96, 80, 112, 88];

const ChipRow = styled('div')({
  display: 'flex',
  gap: categoryRailMetrics.gap,
  paddingBlockStart: categoryRailMetrics.paddingBlockStart,
  paddingInline: categoryRailMetrics.paddingInline,
  overflow: 'hidden',
});

const MenuSkeleton: React.FC = () => {
  return (
    <div aria-busy="true" aria-label={LOADING_LABEL} role="status">
      <ChipRow>
        {CHIP_WIDTHS.map(width => (
          <Skeleton key={width} width={width} height={controlSizes.md.height} radius={controlSizes.md.height} />
        ))}
      </ChipRow>
      <HomeRailSkeleton compact />
      <HomeRailSkeleton />
    </div>
  );
};

export default MenuSkeleton;
