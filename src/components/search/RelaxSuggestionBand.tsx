'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Button, Icon } from '@/components/ui';
import { fontFamilies, pxToRem } from '@/theme';
import { RelaxSuggestion } from './relax-suggestion';
import { tabletGutter } from '@/components/menu/tablet-gutter';
import { searchLayoutMetrics } from './search-metrics';

const ACTION_LABEL = 'tirar filtro';

export interface RelaxSuggestionBandProps {
  suggestion: RelaxSuggestion;
  onRelax: (suggestion: RelaxSuggestion) => void;
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: searchLayoutMetrics.bandGap,
  marginInline: searchLayoutMetrics.bandMarginInline,
  marginBlockEnd: searchLayoutMetrics.bandMarginBlockEnd,
  paddingBlock: searchLayoutMetrics.bandPaddingBlock,
  paddingInline: searchLayoutMetrics.bandPaddingInline,
  borderRadius: searchLayoutMetrics.bandRadius,
  backgroundColor: theme.vars.palette.surface.field,
  ...tabletGutter('marginInline'),
}));

const Glyph = styled(Icon)(({ theme }) => ({
  color: theme.vars.palette.brand.text,
}));

const Message = styled('p')(({ theme }) => ({
  flex: 1,
  minInlineSize: 0,
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(searchLayoutMetrics.bandFontSize),
  lineHeight: searchLayoutMetrics.bandLineHeight,
  color: theme.vars.palette.surface.ink,
}));

/**
 * A faixa nomeia **um** filtro e o ganho de tirá-lo, os dois do servidor. A ação tira exatamente o filtro nomeado:
 * é o único jeito de o número prometido ser o entregue. Sem token de `info` no design system, a superfície é a `field`.
 */
const RelaxSuggestionBand: React.FC<RelaxSuggestionBandProps> = ({ suggestion, onRelax }) => {
  return (
    <Root role="status">
      <Glyph name="info" size={searchLayoutMetrics.bandIconSize} aria-hidden />
      <Message>
        {'Tirando o filtro '}
        <strong>{suggestion.subject}</strong>
        {', aparecem mais '}
        <strong>{suggestion.gain}</strong>
        {'.'}
      </Message>
      <Button variant="secondary" size="md" onClick={() => onRelax(suggestion)}>
        {ACTION_LABEL}
      </Button>
    </Root>
  );
};

export default RelaxSuggestionBand;
