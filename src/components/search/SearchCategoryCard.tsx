'use client';

import React from 'react';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import { categoryRouteHref } from '@/routes/app-routes';
import { controlSizes, focusRing, fontFamilies, HOVER_MEDIA_QUERY, pxToRem, searchCategoryGridMetrics } from '@/theme';
import { MenuCategory } from '@/types/menu-category';

export interface SearchCategoryCardProps {
  category: MenuCategory;
}

const Card = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  minInlineSize: 0,
  minBlockSize: controlSizes.md.height,
  paddingBlock: searchCategoryGridMetrics.cardPaddingBlock,
  paddingInline: searchCategoryGridMetrics.cardPaddingInline,
  borderRadius: searchCategoryGridMetrics.cardRadius,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: searchCategoryGridMetrics.cardShadow,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(searchCategoryGridMetrics.nameFontSize),
  fontWeight: searchCategoryGridMetrics.nameFontWeight,
  lineHeight: searchCategoryGridMetrics.nameLineHeight,
  color: theme.vars.palette.surface.ink,
  overflowWrap: 'anywhere',
  textDecoration: 'none',
  [HOVER_MEDIA_QUERY]: {
    '&:hover': {
      backgroundColor: theme.vars.palette.surface.field,
    },
  },
  '&:focus-visible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
}));

/** O atalho abre a listagem completa da categoria, não uma busca filtrada e sem termo. */
const SearchCategoryCard: React.FC<SearchCategoryCardProps> = ({ category }) => {
  return <Card href={categoryRouteHref(category.id)}>{category.name}</Card>;
};

export default SearchCategoryCard;
