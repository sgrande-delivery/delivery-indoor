'use client';

import { styled } from '@mui/material/styles';
import { fontFamilies, menuSectionMetrics, pxToRem } from '@/theme';

const MenuSectionTitle = styled('h2')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(menuSectionMetrics.titleFontSize),
  fontWeight: menuSectionMetrics.titleFontWeight,
  lineHeight: menuSectionMetrics.titleLineHeight,
  color: theme.vars.palette.surface.ink,
}));

export default MenuSectionTitle;
