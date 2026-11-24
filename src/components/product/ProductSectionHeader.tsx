'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { fontFamilies, productSectionMetrics, pxToRem } from '@/theme';

export interface ProductSectionHeaderProps {
  titleId?: string;
  title: string;
  support?: string;
  isSupportPending?: boolean;
  // A fonte usa 14 nos blocos de grupo, receita e observação, e 10 no de sabores. O valor vem do
  // chamador porque quem conhece o bloco é ele; o número mora sempre em `component-tokens`.
  marginBlockEnd?: number;
  action?: React.ReactNode;
}

interface SupportProps {
  isPending: boolean;
}

interface RootProps {
  marginBlockEnd: number;
}

const Root = styled('div', {
  shouldForwardProp: prop => prop !== 'marginBlockEnd',
})<RootProps>(({ marginBlockEnd }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: productSectionMetrics.headerGap,
  marginBlockEnd,
}));

const Content = styled('div')({
  flex: 1,
  minWidth: 0,
});

const Title = styled('h3')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productSectionMetrics.titleFontSize),
  fontWeight: productSectionMetrics.titleFontWeight,
  lineHeight: productSectionMetrics.titleLineHeight,
  color: theme.vars.palette.surface.ink,
}));

const Support = styled('p', {
  shouldForwardProp: prop => prop !== 'isPending',
})<SupportProps>(({ theme, isPending }) => ({
  margin: 0,
  marginBlockStart: productSectionMetrics.supportMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productSectionMetrics.supportFontSize),
  fontWeight: isPending ? productSectionMetrics.supportFontWeight : undefined,
  lineHeight: productSectionMetrics.supportLineHeight,
  color: isPending ? theme.vars.palette.error.main : theme.vars.palette.surface.muted,
}));

const ActionSlot = styled('div')({
  display: 'flex',
  flexShrink: 0,
  gap: productSectionMetrics.headerGap,
});

const ProductSectionHeader: React.FC<ProductSectionHeaderProps> = ({
  titleId,
  title,
  support,
  isSupportPending = false,
  marginBlockEnd = productSectionMetrics.headerMarginBlockEnd,
  action,
}) => {
  return (
    <Root marginBlockEnd={marginBlockEnd}>
      <Content>
        <Title id={titleId}>{title}</Title>
        {support && <Support isPending={isSupportPending}>{support}</Support>}
      </Content>
      {action && <ActionSlot>{action}</ActionSlot>}
    </Root>
  );
};

export default ProductSectionHeader;
