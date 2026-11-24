'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { SearchFacetCategory } from '@/types/product-page';
import CategoryFacetChip from './CategoryFacetChip';
import { tabletGutter } from '@/components/menu/tablet-gutter';
import { searchLayoutMetrics } from './search-metrics';

const RAIL_LABEL = 'Categorias da busca';

export interface CategoryFacetRailProps {
  facets: SearchFacetCategory[];
  categoryId: number | null;
  /** Tocar na selecionada a tira (`null`). */
  onSelect: (categoryId: number | null) => void;
}

const Rail = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: searchLayoutMetrics.railGap,
  paddingInline: searchLayoutMetrics.railPaddingInline,
  paddingBlockEnd: searchLayoutMetrics.railPaddingBlockEnd,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  ...tabletGutter('paddingInline'),
});

/** Só `count > 0` aparece, mais a categoria selecionada mesmo zerada: o cliente precisa poder desmarcá-la. */
export function selectVisibleFacets(facets: SearchFacetCategory[], categoryId: number | null): SearchFacetCategory[] {
  return facets.filter(facet => facet.count > 0 || facet.id === categoryId);
}

/** O `count` é o do servidor, sem recontagem — a faceta ignora o próprio filtro de categoria. */
const CategoryFacetRail: React.FC<CategoryFacetRailProps> = ({ facets, categoryId, onSelect }) => {
  const visible = selectVisibleFacets(facets, categoryId);

  if (visible.length === 0) {
    return null;
  }

  return (
    <Rail role="group" aria-label={RAIL_LABEL}>
      {visible.map(facet => (
        <CategoryFacetChip key={facet.id} facet={facet} isSelected={facet.id === categoryId} onSelect={onSelect} />
      ))}
    </Rail>
  );
};

export default CategoryFacetRail;
