'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Skeleton } from '@/components/ui';
import { spacingScale } from '@/theme';
import { boardSkeletonMetrics } from './board-metrics';

const Row = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: spacingScale.sm,
});

// o `Skeleton` mede 100% do pai: sem o pai flexível a barra soma a largura da miniatura e passa da borda do cartão
const Bar = styled('div')({
  flex: 1,
  minInlineSize: 0,
});

const BoardSkeletonItemRow: React.FC = () => {
  return (
    <Row>
      <Skeleton
        width={boardSkeletonMetrics.itemRowHeight}
        height={boardSkeletonMetrics.itemRowHeight}
        radius={boardSkeletonMetrics.itemThumbRadius}
      />
      <Bar>
        <Skeleton width="100%" height={boardSkeletonMetrics.itemRowHeight} />
      </Bar>
    </Row>
  );
};

export default BoardSkeletonItemRow;
