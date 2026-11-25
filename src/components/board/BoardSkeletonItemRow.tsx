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

const BoardSkeletonItemRow: React.FC = () => {
  return (
    <Row>
      <Skeleton
        width={boardSkeletonMetrics.itemRowHeight}
        height={boardSkeletonMetrics.itemRowHeight}
        radius={boardSkeletonMetrics.itemThumbRadius}
      />
      <Skeleton width="100%" height={boardSkeletonMetrics.itemRowHeight} />
    </Row>
  );
};

export default BoardSkeletonItemRow;
