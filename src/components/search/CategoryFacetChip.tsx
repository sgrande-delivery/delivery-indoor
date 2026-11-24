'use client';

import React from 'react';
import MenuCategoryChip from '@/components/menu/MenuCategoryChip';
import { SearchFacetCategory } from '@/types/product-page';

export interface CategoryFacetChipProps {
  facet: SearchFacetCategory;
  isSelected: boolean;
  /** Tocar na selecionada a tira (`null`). */
  onSelect: (categoryId: number | null) => void;
}

const CategoryFacetChip: React.FC<CategoryFacetChipProps> = ({ facet, isSelected, onSelect }) => {
  return (
    <MenuCategoryChip
      padding="sm"
      label={facet.name}
      count={facet.count}
      selected={isSelected}
      onClick={() => onSelect(isSelected ? null : facet.id)}
    />
  );
};

export default CategoryFacetChip;
