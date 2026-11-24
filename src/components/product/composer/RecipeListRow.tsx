'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Checkbox } from '@/components/ui';
import { fontFamilies, productSectionMetrics, pxToRem, recipeListMetrics } from '@/theme';
import { RemovableRecipeLine } from './recipe';

// Alvo de toque do tablet compartilhado: a linha inteira é o controle.
const ROW_MIN_BLOCK_SIZE = 56;

const REMOVE_PREFIX = 'Sem ';
const UNNAMED_INGREDIENT = 'ingrediente';

export interface RecipeListRowProps {
  line: RemovableRecipeLine;
  isRemoved: boolean;
  onToggle: (ingredientPublicId: string, isKept: boolean) => void;
}

interface NameProps {
  isRemoved: boolean;
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: productSectionMetrics.rowGap,
  minBlockSize: ROW_MIN_BLOCK_SIZE,
  paddingBlock: recipeListMetrics.rowPaddingBlock,
  borderTop: `${productSectionMetrics.rowBorderWidth}px solid ${theme.vars.palette.surface.line}`,
}));

const Name = styled('label', {
  shouldForwardProp: prop => prop !== 'isRemoved',
})<NameProps>(({ theme, isRemoved }) => ({
  alignSelf: 'stretch',
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  minWidth: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productSectionMetrics.labelFontSize),
  lineHeight: productSectionMetrics.labelLineHeight,
  color: isRemoved ? theme.vars.palette.surface.muted : theme.vars.palette.surface.ink,
  cursor: 'pointer',
}));

// O marcado é "Sem {ingrediente}": o estado do compositor é a lista de removidos, e a linha é o
// controle inteiro (o rótulo ocupa a largura toda).
const RecipeListRow: React.FC<RecipeListRowProps> = ({ line, isRemoved, onToggle }) => {
  const inputId = `ingredient-${line.ingredient_public_id}`;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onToggle(line.ingredient_public_id, !event.target.checked);
  }

  return (
    <Root>
      <Name htmlFor={inputId} isRemoved={isRemoved}>
        {`${REMOVE_PREFIX}${line.ingredient_name ?? UNNAMED_INGREDIENT}`}
      </Name>
      <Checkbox id={inputId} size={recipeListMetrics.controlSize} checked={isRemoved} onChange={handleChange} />
    </Root>
  );
};

export default RecipeListRow;
