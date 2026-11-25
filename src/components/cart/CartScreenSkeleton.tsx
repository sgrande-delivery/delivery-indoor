'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Skeleton } from '@/components/ui';
import { cartItemMetrics, cartRowMetrics, cartScreenMetrics } from '@/theme';

const LOADING_LABEL = 'Carregando a sua sacola';

const ITEMS = Array.from({ length: cartScreenMetrics.skeleton.itemCount }, (unused, index) => index);

const List = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: cartScreenMetrics.listGap,
});

const TableRow = styled(Skeleton)({
  marginBlockEnd: cartScreenMetrics.restaurantMarginBlockEnd,
});

/** A forma do item, sem o total: no primeiro frame não se sabe se a sacola tem item algum. */
const CartScreenSkeleton: React.FC = () => {
  return (
    <div role="status" aria-label={LOADING_LABEL}>
      <TableRow height={cartScreenMetrics.skeleton.restaurantBlockSize} radius={cartRowMetrics.radius} />
      <List>
        {ITEMS.map(index => (
          <Skeleton key={index} height={cartScreenMetrics.skeleton.itemBlockSize} radius={cartItemMetrics.radius} />
        ))}
      </List>
    </div>
  );
};

export default CartScreenSkeleton;
