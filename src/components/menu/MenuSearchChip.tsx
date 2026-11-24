'use client';

import React from 'react';
import Link from 'next/link';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { SEARCH_ROUTE } from '@/routes/app-routes';
import { controlSizes, focusRing, radii } from '@/theme';
import { productGridMetrics } from './product-grid-metrics';

const SEARCH_LABEL = 'Buscar no cardápio';

// No celular a busca é aba do shell; a chip só existe no tablet.
const Root = styled(ButtonBase)(({ theme }) => ({
  display: 'none',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: controlSizes.md.height,
  blockSize: controlSizes.md.height,
  border: `${productGridMetrics.searchChipBorderWidth}px solid ${theme.vars.palette.surface.line}`,
  borderRadius: radii.pill,
  backgroundColor: theme.vars.palette.surface.card,
  color: theme.vars.palette.surface.ink,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'inline-flex',
  },
})) as typeof ButtonBase;

const MenuSearchChip: React.FC = () => {
  return (
    <Root component={Link} href={SEARCH_ROUTE} aria-label={SEARCH_LABEL}>
      <Icon name="search" size={productGridMetrics.searchChipIconSize} />
    </Root>
  );
};

export default MenuSearchChip;
