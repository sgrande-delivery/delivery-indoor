'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { phoneGutter } from '@/components/menu/tablet-gutter';
import { categoryListMetrics } from '@/theme';
import CategorySkeletonItem from './CategorySkeletonItem';

const LOADING_LABEL = 'Carregando os produtos da categoria';
const SKELETON_PLACEHOLDERS = [0, 1, 2, 3];

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: categoryListMetrics.gap,
  paddingBlockStart: categoryListMetrics.paddingBlockStart,
  paddingBlockEnd: categoryListMetrics.paddingBlockEnd,
  paddingInline: phoneGutter,
});

const CategoryListSkeleton: React.FC = () => {
  return (
    <Root role="status" aria-busy="true" aria-label={LOADING_LABEL}>
      {SKELETON_PLACEHOLDERS.map(placeholder => (
        <CategorySkeletonItem key={placeholder} />
      ))}
    </Root>
  );
};

export default CategoryListSkeleton;
