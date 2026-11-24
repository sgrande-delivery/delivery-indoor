'use client';

import React, { useState } from 'react';
import MenuCategoryChip from '@/components/menu/MenuCategoryChip';
import { SearchFilters } from '@/helpers/search-params';
import AppliedIngredientChipList from './AppliedIngredientChipList';
import { withoutIngredient } from './ingredient-direction';
import IngredientFilterOverlay from './IngredientFilterOverlay';
import { useIngredients } from './use-ingredients';

const OPEN_LABEL = 'ingrediente';

export interface IngredientFilterChipsProps {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
}

/**
 * As chips aplicadas e a que abre o seletor, como filhas diretas da trilha. O nome vem do catálogo sem termo, porque
 * o endereço só tem uuid; enquanto ele não chega o filtro aplicado nunca some da trilha.
 */
const IngredientFilterChips: React.FC<IngredientFilterChipsProps> = ({ filters, onChange }) => {
  const [isOpen, setOpen] = useState(false);
  const catalog = useIngredients('').data ?? [];

  const handleApply = (next: SearchFilters) => {
    setOpen(false);
    onChange(next);
  };

  return (
    <>
      <AppliedIngredientChipList
        filters={filters}
        catalog={catalog}
        onRemove={id => onChange(withoutIngredient(filters, id))}
      />
      <MenuCategoryChip
        icon="add"
        padding="sm"
        label={OPEN_LABEL}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      />
      <IngredientFilterOverlay
        open={isOpen}
        filters={filters}
        catalog={catalog}
        onApply={handleApply}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default IngredientFilterChips;
