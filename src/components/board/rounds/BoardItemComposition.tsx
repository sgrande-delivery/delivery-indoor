'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { fontFamilies, pxToRem } from '@/theme';
import type { BoardItemCompositionLines } from './board-item-composition';
import { describeBoardExtra, describeBoardRemoved } from './board-item-text';
import { roundsMetrics } from './rounds-metrics';

export interface BoardItemCompositionProps {
  composition: BoardItemCompositionLines;
}

const OPENING_QUOTE = '“';
const CLOSING_QUOTE = '”';

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: roundsMetrics.compositionGap,
  marginBlockStart: roundsMetrics.compositionMarginBlockStart,
});

const Line = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(roundsMetrics.compositionFontSize),
  lineHeight: roundsMetrics.lineHeight,
  color: theme.vars.palette.surface.muted,
}));

const Removed = styled(Line)(({ theme }) => ({
  fontWeight: roundsMetrics.compositionWeight,
  color: theme.vars.palette.toneOnCard.danger,
}));

const Observation = styled(Line)(({ theme }) => ({
  fontStyle: 'italic',
  color: theme.vars.palette.surface.muted,
}));

const BoardItemComposition: React.FC<BoardItemCompositionProps> = ({ composition }) => {
  return (
    <Root>
      {composition.options.map((option, index) => (
        <Line key={`${option.label}-${index}`}>{option.label ? `${option.label}: ${option.value}` : option.value}</Line>
      ))}
      {composition.extras.map((extra, index) => (
        <Line key={`${extra.name}-${index}`}>{describeBoardExtra(extra)}</Line>
      ))}
      {composition.removed.map((name, index) => (
        <Removed key={`${name}-${index}`}>{describeBoardRemoved(name)}</Removed>
      ))}
      {composition.observation !== null && (
        <Observation>
          {OPENING_QUOTE}
          {composition.observation}
          {CLOSING_QUOTE}
        </Observation>
      )}
    </Root>
  );
};

export default BoardItemComposition;
