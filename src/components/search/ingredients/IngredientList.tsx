'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import { Skeleton } from '@/components/ui';
import { SearchFilters } from '@/helpers/search-params';
import { resolveErrorCode } from '@/services/http-error-code';
import { fontFamilies, pxToRem } from '@/theme';
import { Ingredient } from '@/types/ingredient';
import { IngredientDirection } from './ingredient-direction';
import { ingredientMetrics } from './ingredient-metrics';
import IngredientRow from './IngredientRow';

const ERROR_MESSAGE = 'Não foi possível carregar os ingredientes.';

export interface IngredientListProps {
  ingredients: Ingredient[] | undefined;
  term: string;
  error: unknown;
  isRetrying: boolean;
  filters: SearchFilters;
  helpId: string;
  onToggle: (id: string, direction: IngredientDirection) => void;
  onRetry: () => void;
}

const Items = styled('ul')({
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

const Status = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: ingredientMetrics.rowPaddingBlock,
  paddingBlock: ingredientMetrics.statusPaddingBlock,
  paddingInline: ingredientMetrics.rowPaddingInline,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(ingredientMetrics.statusFontSize),
  color: theme.vars.palette.surface.muted,
}));

const ErrorCode = styled('small')({
  fontSize: pxToRem(ingredientMetrics.countFontSize),
});

const IngredientList: React.FC<IngredientListProps> = ({
  ingredients,
  term,
  error,
  isRetrying,
  filters,
  helpId,
  onToggle,
  onRetry,
}) => {
  if (ingredients === undefined && error) {
    return (
      <Status>
        <InlineError message={ERROR_MESSAGE} onRetry={onRetry} isRetrying={isRetrying} />
        <ErrorCode>{resolveErrorCode(error)}</ErrorCode>
      </Status>
    );
  }

  if (ingredients === undefined) {
    return (
      <Status aria-busy>
        {Array.from({ length: ingredientMetrics.skeletonRows }, (_, index) => (
          <Skeleton key={index} variant="rect" height={ingredientMetrics.skeletonRowBlockSize} />
        ))}
      </Status>
    );
  }

  if (ingredients.length === 0) {
    return <Status>{term === '' ? 'Nenhum ingrediente' : `Nenhum ingrediente com “${term}”`}</Status>;
  }

  return (
    <Items>
      {ingredients.map(ingredient => (
        <IngredientRow
          key={ingredient.id}
          ingredient={ingredient}
          filters={filters}
          helpId={helpId}
          onToggle={onToggle}
        />
      ))}
    </Items>
  );
};

export default IngredientList;
