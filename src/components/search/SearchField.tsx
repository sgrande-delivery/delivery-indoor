'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { visuallyHiddenStyles } from '@/components/ui/VisuallyHidden';
import { SEARCH_TERM_MAX_LENGTH } from '@/helpers/search-params';
import { focusRing, fontFamilies, pxToRem, radii, searchFieldMetrics } from '@/theme';
import { searchLayoutMetrics } from './search-metrics';

const FIELD_LABEL = 'Buscar no cardápio';
const CLEAR_LABEL = 'Limpar busca';
const PLACEHOLDER = 'O que você quer comer?';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onClear: () => void;
  autoFocus?: boolean;
}

const Root = styled('form')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  minInlineSize: 0,
  boxSizing: 'border-box',
  blockSize: searchLayoutMetrics.fieldBlockSize,
  gap: searchFieldMetrics.gap,
  paddingInline: searchFieldMetrics.paddingInline,
  borderRadius: searchFieldMetrics.radius,
  border: `${searchFieldMetrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: searchFieldMetrics.shadow,
  transition: theme.transitions.create(['border-color']),
  '&:focus-within': {
    borderWidth: searchFieldMetrics.focusBorderWidth,
    borderColor: theme.vars.palette.primary.main,
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
  fontWeight: searchFieldMetrics.fontWeight,
  lineHeight: searchFieldMetrics.lineHeight,
  color: theme.vars.palette.surface.ink,
  caretColor: theme.vars.palette.primary.main,
  '&::placeholder': {
    color: theme.vars.palette.surface.muted,
    opacity: 1,
  },
  // O botão de limpar do WebKit desenharia um segundo `close` ao lado do nosso.
  '&::-webkit-search-cancel-button': {
    display: 'none',
  },
}));

const Clear = styled(ButtonBase)(({ theme }) => ({
  flexShrink: 0,
  inlineSize: searchLayoutMetrics.fieldClearSize,
  blockSize: searchLayoutMetrics.fieldClearSize,
  marginInlineEnd: searchLayoutMetrics.fieldClearOffset,
  borderRadius: radii.pill,
  color: theme.vars.palette.surface.muted,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
}));

/**
 * O campo é um `form`: `Enter` envia, o teclado do celular mostra a tecla de busca e o envio é um lugar só.
 * O campo só devolve o texto: quando ele vai para o endereço é de quem o usa.
 */
const SearchField: React.FC<SearchFieldProps> = ({ value, onChange, onSubmit, onClear, autoFocus = false }) => {
  const inputId = React.useId();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value);
  };

  return (
    <Root role="search" onSubmit={handleSubmit}>
      <Glyph name="search" size={searchFieldMetrics.iconSize} aria-hidden />
      <Label htmlFor={inputId}>{FIELD_LABEL}</Label>
      <Control
        id={inputId}
        type="search"
        value={value}
        placeholder={PLACEHOLDER}
        maxLength={SEARCH_TERM_MAX_LENGTH}
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        onChange={event => onChange(event.target.value)}
      />
      {value !== '' && (
        <Clear type="button" aria-label={CLEAR_LABEL} onClick={onClear}>
          <Icon name="close" size={searchFieldMetrics.iconSize} />
        </Clear>
      )}
    </Root>
  );
};

export default SearchField;
