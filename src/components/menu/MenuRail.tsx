'use client';

import { styled } from '@mui/material/styles';
import { menuRailMetrics } from '@/theme';
import { tabletGutter } from './tablet-gutter';

const MenuRail = styled('div')(
  {
    display: 'flex',
    gap: menuRailMetrics.gap,
    paddingInline: menuRailMetrics.paddingInline,
    paddingBlockEnd: menuRailMetrics.paddingBlockEnd,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  tabletGutter('paddingInline')
);

export default MenuRail;
