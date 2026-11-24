'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { tabletPortraitShellMediaQuery, tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { MenuCategory } from '@/types/menu-category';
import { searchCategoryGridMetrics } from '@/theme';
import SearchCategoryCard from './SearchCategoryCard';
import { searchLayoutMetrics } from './search-metrics';

export interface SearchCategoryGridProps {
  categories: MenuCategory[];
}

const Grid = styled('div')({
  display: 'grid',
  gridTemplateColumns: `repeat(${searchCategoryGridMetrics.columns}, minmax(0, 1fr))`,
  gap: searchCategoryGridMetrics.gap,
  [`@media ${tabletShellMediaQuery}`]: {
    gridTemplateColumns: `repeat(${searchLayoutMetrics.entryGridColumnsLandscape}, minmax(0, 1fr))`,
  },
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    gridTemplateColumns: `repeat(${searchLayoutMetrics.entryGridColumnsPortrait}, minmax(0, 1fr))`,
  },
});

const SearchCategoryGrid: React.FC<SearchCategoryGridProps> = ({ categories }) => {
  return (
    <Grid>
      {categories.map(category => (
        <SearchCategoryCard key={category.id} category={category} />
      ))}
    </Grid>
  );
};

export default SearchCategoryGrid;
