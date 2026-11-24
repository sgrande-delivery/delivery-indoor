'use client';

import React from 'react';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import { IconButton } from '@/components/ui';
import { HOME_ROUTE } from '@/routes/app-routes';
import { tabletGutter } from '@/components/menu/tablet-gutter';
import { searchLayoutMetrics } from './search-metrics';

const BACK_LABEL = 'Voltar ao cardápio';

export interface SearchHeaderProps {
  children: React.ReactNode;
}

const Root = styled('header')({
  display: 'flex',
  alignItems: 'center',
  gap: searchLayoutMetrics.headerGap,
  paddingBlockStart: searchLayoutMetrics.headerPaddingBlockStart,
  paddingBlockEnd: searchLayoutMetrics.headerPaddingBlockEnd,
  paddingInline: searchLayoutMetrics.railPaddingInline,
  ...tabletGutter('paddingInline'),
});

/** O voltar é um `Link` para o cardápio: a busca é aba do shell, e voltar não depende do histórico. */
const SearchHeader: React.FC<SearchHeaderProps> = ({ children }) => {
  return (
    <Root>
      <IconButton component={Link} href={HOME_ROUTE} icon="arrow_back" variant="neutral" aria-label={BACK_LABEL} />
      {children}
    </Root>
  );
};

export default SearchHeader;
