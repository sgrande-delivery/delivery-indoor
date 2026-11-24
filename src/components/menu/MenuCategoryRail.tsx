'use client';

import React from 'react';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import { categoryRouteHref } from '@/routes/app-routes';
import { categoryRailMetrics } from '@/theme';
import { MenuCategory } from '@/types/menu-category';
import MenuCategoryChip from './MenuCategoryChip';

const RAIL_LABEL = 'Categorias do cardápio';

export interface MenuCategoryRailProps {
  /** Já visíveis (`selectVisibleCategories`). */
  categories: MenuCategory[];
  currentCategoryId: number | null;
  /** A chip de busca do tablet entra aqui na 06. */
  trailing?: React.ReactNode;
}

const Rail = styled('nav')({
  display: 'flex',
  alignItems: 'center',
  gap: categoryRailMetrics.gap,
  paddingBlockStart: categoryRailMetrics.paddingBlockStart,
  paddingBlockEnd: categoryRailMetrics.paddingBlockEnd,
  paddingInline: categoryRailMetrics.paddingInline,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

/**
 * As chips **navegam** (não alternam): cada uma é um `Link` para a listagem da categoria, e só a aberta leva
 * `current`. O contrato não traz ícone de categoria, e mapear nome para ícone no cliente seria inventar dado do tenant.
 */
const MenuCategoryRail: React.FC<MenuCategoryRailProps> = ({ categories, currentCategoryId, trailing }) => {
  // A trilha some só quando não há nada para mostrar: a chip de busca do tablet (`trailing`) sobrevive a uma loja sem
  // categoria visível.
  if (categories.length === 0 && trailing === undefined) {
    return null;
  }

  return (
    <Rail aria-label={RAIL_LABEL}>
      {categories.map(category => (
        <MenuCategoryChip
          key={category.id}
          component={Link}
          href={categoryRouteHref(category.id)}
          label={category.name}
          current={category.id === currentCategoryId}
        />
      ))}
      {trailing}
    </Rail>
  );
};

export default MenuCategoryRail;
