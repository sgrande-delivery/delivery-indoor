'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { focusRing, fontFamilies, fontWeights, interactionOpacities, pxToRem } from '@/theme';
import { IngredientDirection } from './ingredient-direction';
import { ingredientMetrics } from './ingredient-metrics';

const INCLUDE_LABEL = 'com';
const EXCLUDE_LABEL = 'sem';

export interface IngredientDirectionToggleProps {
  name: string;
  direction: IngredientDirection | null;
  isIncludeBlocked: boolean;
  isExcludeBlocked: boolean;
  /** O id da frase de ajuda que explica o limite: é o que um botão desabilitado diz de si. */
  helpId: string;
  onToggle: (direction: IngredientDirection) => void;
}

const Root = styled('div')(({ theme }) => ({
  display: 'inline-flex',
  flexShrink: 0,
  gap: ingredientMetrics.segmentPadding,
  padding: ingredientMetrics.segmentPadding,
  borderRadius: ingredientMetrics.segmentRadius,
  backgroundColor: theme.vars.palette.surface.field,
}));

interface SegmentProps {
  segmentDirection: IngredientDirection;
}

const Segment = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'segmentDirection',
})<SegmentProps>(({ theme, segmentDirection }) => {
  const tone = segmentDirection === 'include' ? theme.vars.palette.success : theme.vars.palette.error;

  return {
    minInlineSize: ingredientMetrics.segmentMinInlineSize,
    blockSize: ingredientMetrics.segmentBlockSize,
    borderRadius: ingredientMetrics.segmentRadius - ingredientMetrics.segmentPadding,
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(ingredientMetrics.segmentFontSize),
    fontWeight: fontWeights.bold,
    color: theme.vars.palette.surface.muted,
    '&[aria-pressed="true"]': {
      backgroundColor: tone.main,
      color: tone.contrastText,
    },
    '&.Mui-disabled': {
      opacity: interactionOpacities.disabled,
    },
    '&.Mui-focusVisible': {
      outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
      outlineOffset: focusRing.offset,
    },
  };
});

/** Dois botões `aria-pressed`, no máximo um aceso: o estado vem das listas pendentes, e este componente só o desenha. */
const IngredientDirectionToggle: React.FC<IngredientDirectionToggleProps> = ({
  name,
  direction,
  isIncludeBlocked,
  isExcludeBlocked,
  helpId,
  onToggle,
}) => {
  return (
    <Root role="group" aria-label={name}>
      <Segment
        segmentDirection="include"
        aria-pressed={direction === 'include'}
        aria-describedby={isIncludeBlocked ? helpId : undefined}
        disabled={isIncludeBlocked}
        onClick={() => onToggle('include')}
      >
        {INCLUDE_LABEL}
      </Segment>
      <Segment
        segmentDirection="exclude"
        aria-pressed={direction === 'exclude'}
        aria-describedby={isExcludeBlocked ? helpId : undefined}
        disabled={isExcludeBlocked}
        onClick={() => onToggle('exclude')}
      >
        {EXCLUDE_LABEL}
      </Segment>
    </Root>
  );
};

export default IngredientDirectionToggle;
