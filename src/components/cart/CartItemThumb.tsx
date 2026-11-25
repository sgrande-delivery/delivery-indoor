'use client';

import React from 'react';
import Image from 'next/image';
import { styled } from '@mui/material/styles';
import { cartItemMetrics } from '@/theme';

export interface CartItemThumbProps {
  imageUrl: string | null;
}

const Root = styled('span')(({ theme }) => ({
  position: 'relative',
  display: 'block',
  inlineSize: cartItemMetrics.imageSize,
  blockSize: cartItemMetrics.imageSize,
  flexShrink: 0,
  borderRadius: cartItemMetrics.imageRadius,
  overflow: 'hidden',
  backgroundColor: theme.vars.palette.surface.field,
}));

const Photo = styled(Image)({
  objectFit: 'cover',
});

const CartItemThumb: React.FC<CartItemThumbProps> = ({ imageUrl }) => {
  return <Root>{imageUrl && <Photo src={imageUrl} alt="" fill sizes={`${cartItemMetrics.imageSize}px`} />}</Root>;
};

export default CartItemThumb;
