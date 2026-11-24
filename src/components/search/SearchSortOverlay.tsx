'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Overlay } from '@/components/ui';
import { ProductSort } from '@/types/product-page';
import { searchSortOptions } from './search-sort';
import SearchSortOptionItem from './SearchSortOptionItem';

const OVERLAY_LABEL = 'Ordenar por';

export interface SearchSortOverlayProps {
  open: boolean;
  /** Já resolvida: a ordenação padrão aparece marcada. */
  current: ProductSort;
  onSelect: (sort: ProductSort) => void;
  onClose: () => void;
}

const Options = styled('ul')({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

const SearchSortOverlay: React.FC<SearchSortOverlayProps> = ({ open, current, onSelect, onClose }) => {
  return (
    <Overlay open={open} onClose={onClose} aria-label={OVERLAY_LABEL}>
      <Options>
        {searchSortOptions.map(option => (
          <SearchSortOptionItem
            key={option.sort}
            option={option}
            isChecked={option.sort === current}
            onSelect={onSelect}
          />
        ))}
      </Options>
    </Overlay>
  );
};

export default SearchSortOverlay;
