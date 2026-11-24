'use client';

import React from 'react';
import MenuCategoryChip from '@/components/menu/MenuCategoryChip';
import { ProductSort } from '@/types/product-page';
import { findSearchSortOption } from './search-sort';

export interface SearchSortChipProps {
  /** Já resolvida: sem `sort` no endereço vale `best_selling`. */
  sort: ProductSort;
  onOpen: () => void;
}

/** A chip mostra a ordenação ativa e abre a lista; o primitivo não tem ícone final, então não há `expand_more`. */
const SearchSortChip: React.FC<SearchSortChipProps> = ({ sort, onOpen }) => {
  return (
    <MenuCategoryChip
      icon="swap_vert"
      padding="sm"
      label={findSearchSortOption(sort).label}
      aria-haspopup="dialog"
      onClick={onOpen}
    />
  );
};

export default SearchSortChip;
