'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Radio } from '@/components/ui';
import { controlSizes, spacingScale } from '@/theme';
import { ProductSort } from '@/types/product-page';
import { SearchSortOption } from './search-sort';

const OPTIONS_NAME = 'search-sort';

export interface SearchSortOptionItemProps {
  option: SearchSortOption;
  isChecked: boolean;
  onSelect: (sort: ProductSort) => void;
}

const Item = styled('li')({
  display: 'flex',
});

// A linha inteira é o alvo de toque, com a altura do `control-md` (RN-08 da #20).
const OptionRadio = styled(Radio)({
  flex: 1,
  minBlockSize: controlSizes.md.height,
  paddingInline: spacingScale.md,
});

const SearchSortOptionItem: React.FC<SearchSortOptionItemProps> = ({ option, isChecked, onSelect }) => {
  return (
    <Item>
      <OptionRadio
        name={OPTIONS_NAME}
        label={option.label}
        checked={isChecked}
        onChange={() => onSelect(option.sort)}
      />
    </Item>
  );
};

export default SearchSortOptionItem;
