'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { fontFamilies, productAlertMetrics, pxToRem } from '@/theme';

export interface ProductSheetAlertProps {
  message: string;
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: productAlertMetrics.gap,
  paddingBlock: productAlertMetrics.paddingBlock,
  paddingInline: productAlertMetrics.paddingInline,
  backgroundColor: `rgba(${theme.vars.palette.error.mainChannel} / ${productAlertMetrics.backgroundOpacity})`,
  borderInlineStart: `${productAlertMetrics.borderWidth}px solid ${theme.vars.palette.error.main}`,
  color: theme.vars.palette.error.main,
}));

const Message = styled('span')({
  flex: 1,
  minWidth: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productAlertMetrics.fontSize),
  fontWeight: productAlertMetrics.fontWeight,
  lineHeight: productAlertMetrics.lineHeight,
});

const ProductSheetAlert: React.FC<ProductSheetAlertProps> = ({ message }) => {
  return (
    <Root role="alert">
      <Icon name="error" size={productAlertMetrics.iconSize} />
      <Message>{message}</Message>
    </Root>
  );
};

export default ProductSheetAlert;
