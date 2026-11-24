'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { RemovableChip } from '@/components/ui';
import { controlSizes } from '@/theme';
import { IngredientDirection } from './ingredient-direction';
import { ingredientMetrics } from './ingredient-metrics';

const FALLBACK_NAME = 'ingrediente';

export interface IngredientFilterChipProps {
  id: string;
  /** `undefined` quando o catálogo não tem o id (saiu do cardápio, ou passou do teto de 200): o filtro continua removível. */
  name: string | undefined;
  direction: IngredientDirection;
  onRemove: (id: string) => void;
}

const directionLabels: Record<IngredientDirection, string> = {
  include: 'com',
  exclude: 'sem',
};

// O `close` do primitivo é um glifo de 15 sem padding: o `::after` leva o alvo a 44 sem mexer no desenho da chip.
const TouchChip = styled(RemovableChip)({
  minBlockSize: controlSizes.md.height,
  flexShrink: 0,
  '& > button:last-of-type': {
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      insetBlockStart: '50%',
      insetInlineStart: '50%',
      inlineSize: ingredientMetrics.removeTargetSize,
      blockSize: ingredientMetrics.removeTargetSize,
      transform: 'translate(-50%, -50%)',
    },
  },
});

const IngredientFilterChip: React.FC<IngredientFilterChipProps> = ({ id, name, direction, onRemove }) => {
  const label = `${directionLabels[direction]} ${name ?? FALLBACK_NAME}`;

  return (
    <TouchChip
      label={label}
      removeLabel={`Tirar o filtro ${label}`}
      tone={direction}
      icon={direction === 'exclude' ? 'do_not_disturb_on' : undefined}
      onRemove={() => onRemove(id)}
    />
  );
};

export default IngredientFilterChip;
