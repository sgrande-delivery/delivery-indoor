'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { visuallyHiddenStyles } from '@/components/ui/VisuallyHidden';
import { SEARCH_TERM_MAX_LENGTH } from '@/helpers/search-params';
import { fontFamilies, pxToRem, searchFieldMetrics } from '@/theme';
import { ingredientMetrics } from './ingredient-metrics';

const FIELD_LABEL = 'Buscar ingrediente';
const PLACEHOLDER = 'Buscar ingrediente — cheddar, bacon, cebola…';

export interface IngredientSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: searchFieldMetrics.gap,
  boxSizing: 'border-box',
  blockSize: ingredientMetrics.fieldBlockSize,
  marginInline: ingredientMetrics.fieldPaddingInline,
  marginBlock: ingredientMetrics.fieldPaddingBlock,
  paddingInline: searchFieldMetrics.paddingInline,
  borderRadius: searchFieldMetrics.radius,
  backgroundColor: theme.vars.palette.surface.field,
  '&:focus-within': {
    outline: `${searchFieldMetrics.focusBorderWidth}px solid ${theme.vars.palette.primary.main}`,
  },
}));

const Glyph = styled(Icon)(({ theme }) => ({
  color: theme.vars.palette.surface.muted,
}));

const Label = styled('label')(visuallyHiddenStyles);

const Control = styled('input')(({ theme }) => ({
  flex: 1,
  minInlineSize: 0,
  margin: 0,
  padding: 0,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(searchFieldMetrics.fontSize),
  color: theme.vars.palette.surface.ink,
  caretColor: theme.vars.palette.primary.main,
  '&::placeholder': {
    color: theme.vars.palette.surface.muted,
    opacity: 1,
  },
}));

/** O termo deste campo é local do seletor: não vai para o endereço e não é o da busca. */
const IngredientSearchField: React.FC<IngredientSearchFieldProps> = ({ value, onChange }) => {
  const inputId = React.useId();

  return (
    <Root>
      <Glyph name="search" size={searchFieldMetrics.iconSize} aria-hidden />
      <Label htmlFor={inputId}>{FIELD_LABEL}</Label>
      <Control
        id={inputId}
        type="search"
        value={value}
        placeholder={PLACEHOLDER}
        maxLength={SEARCH_TERM_MAX_LENGTH}
        autoComplete="off"
        onChange={event => onChange(event.target.value)}
      />
    </Root>
  );
};

export default IngredientSearchField;
