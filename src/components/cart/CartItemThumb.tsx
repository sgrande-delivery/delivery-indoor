'use client';

import React from 'react';
import Image from 'next/image';
import { styled } from '@mui/material/styles';
import { cartItemMetrics } from '@/theme';

export interface CartItemThumbProps {
  imageUrl: string | null;
  size?: number;
}

const Root = styled('span', {
  shouldForwardProp: prop => prop !== 'size',
})<{ size: number }>(({ theme, size }) => ({
  position: 'relative',
  display: 'block',
  inlineSize: size,
  blockSize: size,
  flexShrink: 0,
  borderRadius: cartItemMetrics.imageRadius,
  overflow: 'hidden',
  backgroundColor: theme.vars.palette.surface.field,
}));

const Photo = styled(Image)({
  objectFit: 'cover',
});

const CartItemThumb: React.FC<CartItemThumbProps> = ({ imageUrl, size = cartItemMetrics.imageSize }) => {
  return <Root size={size}>{imageUrl && <Photo src={imageUrl} alt="" fill sizes={`${size}px`} />}</Root>;
};

export default CartItemThumb;
