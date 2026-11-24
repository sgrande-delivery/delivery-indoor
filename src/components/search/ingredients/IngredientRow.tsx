'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { SearchFilters } from '@/helpers/search-params';
import { fontFamilies, fontWeights, pxToRem } from '@/theme';
import { Ingredient } from '@/types/ingredient';
import { IngredientDirection, isIngredientDirectionBlocked, resolveIngredientDirection } from './ingredient-direction';
import { ingredientMetrics } from './ingredient-metrics';
import IngredientDirectionToggle from './IngredientDirectionToggle';

export interface IngredientRowProps {
  ingredient: Ingredient;
  filters: SearchFilters;
  helpId: string;
  onToggle: (id: string, direction: IngredientDirection) => void;
}

const Root = styled('li')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: ingredientMetrics.rowGap,
  paddingBlock: ingredientMetrics.rowPaddingBlock,
  paddingInline: ingredientMetrics.rowPaddingInline,
  borderBottom: `1px solid ${theme.vars.palette.surface.line}`,
}));

const Text = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minInlineSize: 0,
});

const Name = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(ingredientMetrics.nameFontSize),
  fontWeight: fontWeights.bold,
  color: theme.vars.palette.surface.ink,
}));

const Count = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(ingredientMetrics.countFontSize),
  color: theme.vars.palette.surface.muted,
}));

const numberFormatter = new Intl.NumberFormat('pt-BR');

/** "1 produto", "12 produtos": é o `product_count` do catálogo da mesa, e não o total da busca atual. */
function formatProductCount(count: number): string {
  return `${numberFormatter.format(count)} ${count === 1 ? 'produto' : 'produtos'}`;
}

const IngredientRow: React.FC<IngredientRowProps> = ({ ingredient, filters, helpId, onToggle }) => {
  const { id, name, product_count } = ingredient;

  return (
    <Root>
      <Text>
        <Name>{name}</Name>
        <Count>{formatProductCount(product_count)}</Count>
      </Text>
      <IngredientDirectionToggle
        name={name}
        direction={resolveIngredientDirection(filters, id)}
        isIncludeBlocked={isIngredientDirectionBlocked(filters, id, 'include')}
        isExcludeBlocked={isIngredientDirectionBlocked(filters, id, 'exclude')}
        helpId={helpId}
        onToggle={direction => onToggle(id, direction)}
      />
    </Root>
  );
};

export default IngredientRow;
