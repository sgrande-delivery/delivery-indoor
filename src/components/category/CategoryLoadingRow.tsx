'use client';

import React from 'react';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';
import { categoryListMetrics, fontFamilies, pxToRem } from '@/theme';
import CategorySkeletonItem from './CategorySkeletonItem';

/** A grade do tablet não tem item de linha para repetir: lá só a linha de estado. */
export interface CategoryLoadingRowProps {
  withSkeleton?: boolean;
}

const LOADING_LABEL = 'Carregando mais itens…';

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: categoryListMetrics.gap,
});

const Status = styled('p')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: 0,
  gap: categoryListMetrics.loadingGap,
  paddingBlock: categoryListMetrics.loadingPaddingBlock,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(categoryListMetrics.loadingFontSize),
  fontWeight: categoryListMetrics.loadingFontWeight,
  lineHeight: categoryListMetrics.loadingLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const Spinner = styled('span')(({ theme }) => ({
  boxSizing: 'border-box',
  width: categoryListMetrics.spinnerSize,
  height: categoryListMetrics.spinnerSize,
  flexShrink: 0,
  borderRadius: '50%',
  border: `${categoryListMetrics.spinnerBorderWidth}px solid ${theme.vars.palette.surface.line}`,
  borderTopColor: theme.vars.palette.primary.main,
  animation: `${spin} ${categoryListMetrics.spinnerDurationMs}ms linear infinite`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
}));

// O rodapé de carregamento é o esqueleto de **um** item mais a linha de estado — nunca um spinner
// cobrindo a tela, que é o que a lista já rolada perderia de vista.
const CategoryLoadingRow: React.FC<CategoryLoadingRowProps> = ({ withSkeleton = true }) => {
  return (
    <Root>
      {withSkeleton && <CategorySkeletonItem />}
      <Status role="status">
        <Spinner aria-hidden />
        {LOADING_LABEL}
      </Status>
    </Root>
  );
};

export default CategoryLoadingRow;
