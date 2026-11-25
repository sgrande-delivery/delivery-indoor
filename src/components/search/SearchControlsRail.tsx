'use client';

import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import MenuCategoryChip from '@/components/menu/MenuCategoryChip';
import { tabletGutter } from '@/components/menu/tablet-gutter';
import { resolveSearchSort, SearchFilters } from '@/helpers/search-params';
import { ProductSort, SearchFacetCategory } from '@/types/product-page';
import CategoryFacetChipList from './CategoryFacetChipList';
import { searchLayoutMetrics } from './search-metrics';
import IngredientFilterChips from './ingredients/IngredientFilterChips';
import SearchSortChip from './SearchSortChip';
import SearchSortOverlay from './SearchSortOverlay';

const RAIL_LABEL = 'Ordenação e filtros';
const OFFERS_LABEL = 'Só promoções';

export interface SearchControlsRailProps {
  filters: SearchFilters;
  /** As categorias da faceta do servidor; vazio enquanto a primeira página não chega. */
  facets: SearchFacetCategory[];
  onChange: (next: SearchFilters) => void;
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

/**
 * Ordenação, filtros e categorias numa trilha só, que rola na horizontal: duas linhas de chips empurrariam a lista para
 * baixo. Cada toque aplica na hora — é `router.push`, sem folha de confirmação.
 */
const SearchControlsRail: React.FC<SearchControlsRailProps> = ({ filters, facets, onChange }) => {
  const [isSortOpen, setSortOpen] = useState(false);
  const sort = resolveSearchSort(filters.sort);

  // Escolher a ordenação ativa só fecha: empilhar o mesmo endereço no histórico não leva a lugar nenhum.
  const handleSelectSort = (next: ProductSort) => {
    setSortOpen(false);

    if (next !== sort) {
      onChange({ ...filters, sort: next });
    }
  };

  return (
    <>
      <Rail role="group" aria-label={RAIL_LABEL}>
        <SearchSortChip sort={sort} onOpen={() => setSortOpen(true)} />
        <MenuCategoryChip
          padding="sm"
          label={OFFERS_LABEL}
          selected={filters.onlyOffers}
          tone={filters.onlyOffers ? 'brand' : undefined}
          onClick={() => onChange({ ...filters, onlyOffers: !filters.onlyOffers })}
        />
        <IngredientFilterChips filters={filters} onChange={onChange} />
        <CategoryFacetChipList
          facets={facets}
          categoryId={filters.categoryId}
          onSelect={categoryId => onChange({ ...filters, categoryId })}
        />
      </Rail>
      <SearchSortOverlay
        open={isSortOpen}
        current={sort}
        onSelect={handleSelectSort}
        onClose={() => setSortOpen(false)}
      />
    </>
  );
};

export default SearchControlsRail;
