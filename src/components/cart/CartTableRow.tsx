'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBoardSession } from '@/providers/board-session';
import { cartRowMetrics, fontFamilies, pxToRem } from '@/theme';
import { cartMetrics } from './cart-metrics';

const KITCHEN_NOTE = 'Vai direto para a cozinha';
const COMPACT_KITCHEN_NOTE = 'vai direto para a cozinha';

export interface CartTableRowProps {
  /** Uma linha só, para o painel baixo do tablet em retrato. */
  compact?: boolean;
}

interface RootProps {
  isCompact: boolean;
}

const Root = styled('div', {
  shouldForwardProp: prop => prop !== 'isCompact',
})<RootProps>(({ theme, isCompact }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: cartRowMetrics.restaurant.gap,
  paddingBlock: cartRowMetrics.restaurant.paddingBlock,
  paddingInline: cartRowMetrics.restaurant.paddingInline,
  borderRadius: cartRowMetrics.radius,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: isCompact ? 'none' : cartRowMetrics.shadow,
}));

const Glyph = styled(Icon)(({ theme }) => ({
  flexShrink: 0,
  color: theme.vars.palette.brand.text,
}));

const Body = styled('div')({
  flex: 1,
  minInlineSize: 0,
  lineHeight: cartRowMetrics.restaurant.lineHeight,
});

const Title = styled('div')(({ theme }) => ({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartRowMetrics.restaurant.titleFontSize),
  fontWeight: cartRowMetrics.restaurant.titleFontWeight,
  color: theme.vars.palette.surface.ink,
}));

const Note = styled('div')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartRowMetrics.restaurant.subtitleFontSize),
  color: theme.vars.palette.surface.muted,
}));

/** A mesa de quem pede: sem mesa aberta não há o que mostrar, e a linha não aparece. */
const CartTableRow: React.FC<CartTableRowProps> = ({ compact = false }) => {
  const session = useBoardSession();
  const restaurant = useRestaurant();

  if (session.status !== 'ready') {
    return null;
  }

  const table = `Mesa ${session.movement.board.number}`;
  const title = restaurant.data?.name ? `${table} · ${restaurant.data.name}` : table;

  return (
    <Root isCompact={compact}>
      <Glyph name="table_restaurant" size={compact ? cartMetrics.tableRowCompactIconSize : cartRowMetrics.iconSize} />
      <Body>
        {compact ? (
          <Title>{`${table} · ${COMPACT_KITCHEN_NOTE}`}</Title>
        ) : (
          <>
            <Title>{title}</Title>
            <Note>{KITCHEN_NOTE}</Note>
          </>
        )}
      </Body>
    </Root>
  );
};

export default CartTableRow;
