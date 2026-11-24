'use client';

import { styled } from '@mui/material/styles';
import { menuSectionMetrics } from '@/theme';
import { tabletGutter } from './tablet-gutter';

export interface MenuSectionHeaderProps {
  compact?: boolean;
}

// `compact` é a folga de "Ofertas": 12 em cima contra 16 das outras trilhas. A diferença mora aqui, em token e prop.
const MenuSectionHeader = styled('div', {
  shouldForwardProp: prop => prop !== 'compact',
})<MenuSectionHeaderProps>(
  ({ compact = false }) => ({
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBlockStart: compact
      ? menuSectionMetrics.compactHeaderPaddingBlockStart
      : menuSectionMetrics.headerPaddingBlockStart,
    paddingBlockEnd: menuSectionMetrics.headerPaddingBlockEnd,
    paddingInline: menuSectionMetrics.headerPaddingInline,
  }),
  tabletGutter('paddingInline')
);

export default MenuSectionHeader;
