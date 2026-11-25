'use client';

import React from 'react';
import { SearchFacetCategory } from '@/types/product-page';
import CategoryFacetChip from './CategoryFacetChip';

export interface CategoryFacetChipListProps {
  facets: SearchFacetCategory[];
  categoryId: number | null;
  /** Tocar na selecionada a tira (`null`). */
  onSelect: (categoryId: number | null) => void;
}

/** Só `count > 0` aparece, mais a categoria selecionada mesmo zerada: o cliente precisa poder desmarcá-la. */
export function selectVisibleFacets(facets: SearchFacetCategory[], categoryId: number | null): SearchFacetCategory[] {
  return facets.filter(facet => facet.count > 0 || facet.id === categoryId);
}

/**
 * Um fragmento, e não uma trilha própria: as categorias entram na mesma trilha da ordenação e dos filtros, que rola na
 * horizontal. O `count` é o do servidor, sem recontagem — a faceta ignora o próprio filtro de categoria.
 */
const CategoryFacetChipList: React.FC<CategoryFacetChipListProps> = ({ facets, categoryId, onSelect }) => {
  return (
    <>
      {selectVisibleFacets(facets, categoryId).map(facet => (
        <CategoryFacetChip key={facet.id} facet={facet} isSelected={facet.id === categoryId} onSelect={onSelect} />
      ))}
    </>
  );
};

export default CategoryFacetChipList;
