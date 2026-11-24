'use client';

import { styled } from '@mui/material/styles';
import { menuRailMetrics } from '@/theme';

const MenuRail = styled('div')({
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
});

export default MenuRail;
