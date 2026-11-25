'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Badge, Icon } from '@/components/ui';
import { typographyTokens } from '@/theme';
import { useCartItemCount } from '../use-cart-item-count';
import { cartDockMetrics } from './cart-dock-metrics';

const TITLE = 'Sua sacola';

export interface CartColumnHeaderProps {
  /** O lugar do "Limpar". */
  action?: React.ReactNode;
}

const Root = styled('header')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: cartDockMetrics.column.headerGap,
  paddingBlock: cartDockMetrics.column.headerPaddingBlock,
  paddingInline: cartDockMetrics.column.headerPaddingInline,
  borderBlockEnd: `1px solid ${theme.vars.palette.surface.line}`,
  color: theme.vars.palette.surface.ink,
}));

const Title = styled('h2')({
  ...typographyTokens.h3,
  margin: 0,
});

const Action = styled('div')({
  marginInlineStart: 'auto',
});

const CartColumnHeader: React.FC<CartColumnHeaderProps> = ({ action }) => {
  const count = useCartItemCount();

  return (
    <Root>
      <Icon name="shopping_bag" size={cartDockMetrics.column.headerIconSize} />
      <Title>{TITLE}</Title>
      {count !== undefined && count > 0 && <Badge variant="count">{count}</Badge>}
      {action && <Action>{action}</Action>}
    </Root>
  );
};

export default CartColumnHeader;
