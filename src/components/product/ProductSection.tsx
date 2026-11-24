'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { optionGroupMetrics, productSectionMetrics, ProductSectionSpacing, productSectionSpacings } from '@/theme';

export interface ProductSectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: ProductSectionSpacing;
  isPending?: boolean;
  children: React.ReactNode;
}

interface RootProps {
  spacing: ProductSectionSpacing;
  isPending: boolean;
}

const Root = styled('section', {
  shouldForwardProp: prop => prop !== 'spacing' && prop !== 'isPending',
})<RootProps>(({ theme, spacing, isPending }) => ({
  marginBlockStart: productSectionSpacings[spacing],
  paddingBlock: productSectionMetrics.paddingBlock,
  paddingInline: productSectionMetrics.paddingInline,
  backgroundColor: theme.vars.palette.surface.card,
  ...(isPending
    ? {
        marginInline: optionGroupMetrics.pendingMarginInline,
        border: `${optionGroupMetrics.pendingBorderWidth}px solid ${theme.vars.palette.error.main}`,
        borderRadius: optionGroupMetrics.pendingRadius,
      }
    : {}),
}));

const ProductSection = React.forwardRef<HTMLElement, ProductSectionProps>(function ProductSection(props, ref) {
  const { spacing = 'following', isPending = false, children, ...rest } = props;

  return (
    <Root ref={ref} spacing={spacing} isPending={isPending} {...rest}>
      {children}
    </Root>
  );
});

export default ProductSection;
