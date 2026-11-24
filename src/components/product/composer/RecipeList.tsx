'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { ProductSectionSpacing } from '@/theme';
import ProductSection from '../ProductSection';
import ProductSectionHeader from '../ProductSectionHeader';
import { RemovableRecipeLine } from './recipe';
import RecipeListRow from './RecipeListRow';

const TITLE = 'Tirar ingrediente';

export interface RecipeListProps {
  lines: RemovableRecipeLine[];
  removedIngredients: string[];
  spacing: ProductSectionSpacing;
  onToggle: (ingredientPublicId: string, isKept: boolean) => void;
}

const Rows = styled('div')({
  display: 'flex',
  flexDirection: 'column',
});

const RecipeList: React.FC<RecipeListProps> = ({ lines, removedIngredients, spacing, onToggle }) => {
  return (
    <ProductSection spacing={spacing}>
      <ProductSectionHeader title={TITLE} />
      <Rows>
        {lines.map(line => (
          <RecipeListRow
            key={line.ingredient_public_id}
            line={line}
            isRemoved={removedIngredients.includes(line.ingredient_public_id)}
            onToggle={onToggle}
          />
        ))}
      </Rows>
    </ProductSection>
  );
};

export default RecipeList;
