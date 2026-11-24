'use client';

import React from 'react';
import { SearchFilters } from '@/helpers/search-params';
import { Ingredient } from '@/types/ingredient';
import { IngredientDirection } from './ingredient-direction';
import IngredientFilterChip from './IngredientFilterChip';

export interface AppliedIngredientChipListProps {
  filters: SearchFilters;
  catalog: Ingredient[];
  onRemove: (id: string) => void;
}

interface AppliedIngredient {
  id: string;
  direction: IngredientDirection;
}

function listApplied(filters: SearchFilters): AppliedIngredient[] {
  return [
    ...filters.includeIngredients.map((id): AppliedIngredient => ({ id, direction: 'include' })),
    ...filters.excludeIngredients.map((id): AppliedIngredient => ({ id, direction: 'exclude' })),
  ];
}

/** Um fragmento, e não um contêiner: as chips continuam filhas diretas da trilha. */
const AppliedIngredientChipList: React.FC<AppliedIngredientChipListProps> = ({ filters, catalog, onRemove }) => {
  return (
    <>
      {listApplied(filters).map(({ id, direction }) => (
        <IngredientFilterChip
          key={`${direction}-${id}`}
          id={id}
          name={catalog.find(ingredient => ingredient.id === id)?.name}
          direction={direction}
          onRemove={onRemove}
        />
      ))}
    </>
  );
};

export default AppliedIngredientChipList;
