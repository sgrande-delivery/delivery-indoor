'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { formatCents } from '@/helpers/money';
import { fontFamilies, fontWeights, pxToRem } from '@/theme';
import { CartItem } from '@/types/cart';
import { buildCartItemComposition } from '../cart-item-composition';
import CartItemThumb from '../CartItemThumb';
import { sentMetrics } from './sent-metrics';

const QUANTITY_MARK = '×';

export interface SentItemRowProps {
  item: CartItem;
}

const Root = styled('li')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: sentMetrics.item.gap,
  paddingBlock: sentMetrics.item.paddingBlock,
  listStyle: 'none',
  borderBlockEnd: `${sentMetrics.item.borderWidth}px solid ${theme.vars.palette.surface.line}`,
  '&:last-of-type': {
    borderBlockEnd: 0,
  },
}));

const Body = styled('div')({
  flex: 1,
  minInlineSize: 0,
});

const Name = styled('span')(({ theme }) => ({
  display: 'block',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sentMetrics.item.nameFontSize),
  fontWeight: fontWeights.bold,
  color: theme.vars.palette.surface.ink,
}));

const Composition = styled('span')(({ theme }) => ({
  display: 'block',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sentMetrics.item.compositionFontSize),
  color: theme.vars.palette.surface.muted,
}));

const Price = styled('span')(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sentMetrics.item.priceFontSize),
  fontWeight: fontWeights.extraBold,
  color: theme.vars.palette.surface.ink,
}));

/** Uma linha do que foi enviado, desenhada com o que a sacola tinha: o preço da linha é o do servidor, em centavos. */
const SentItemRow: React.FC<SentItemRowProps> = ({ item }) => {
  const composition = buildCartItemComposition(item);

  return (
    <Root>
      <CartItemThumb imageUrl={item.image_url} size={sentMetrics.item.thumbSize} />
      <Body>
        <Name>{`${item.quantity}${QUANTITY_MARK} ${item.name ?? ''}`.trim()}</Name>
        {composition && <Composition>{composition}</Composition>}
      </Body>
      <Price>{formatCents(item.line_total)}</Price>
    </Root>
  );
};

export default SentItemRow;
