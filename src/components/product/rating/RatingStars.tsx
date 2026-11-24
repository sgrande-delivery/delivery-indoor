'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { describeRatingStars } from './rating-stars';

export interface RatingStarsProps {
  average: number;
  size: number;
  gap: number;
  // Sem rótulo as estrelas são decoração: onde a nota aparece escrita ao lado delas, anunciá-las de
  // novo é repetir a mesma informação duas vezes.
  label?: string;
  className?: string;
}

interface StarProps {
  isEmpty: boolean;
}

interface RootProps {
  gap: number;
}

const Root = styled('span', {
  shouldForwardProp: prop => prop !== 'gap',
})<RootProps>(({ gap }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap,
}));

const Star = styled(Icon, {
  shouldForwardProp: prop => prop !== 'isEmpty',
})<StarProps>(({ theme, isEmpty }) => ({
  color: isEmpty ? theme.vars.palette.surface.line : theme.vars.palette.secondary.main,
}));

const RatingStars: React.FC<RatingStarsProps> = ({ average, size, gap, label, className }) => {
  const shapes = describeRatingStars(average);

  return (
    <Root
      className={className}
      gap={gap}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {shapes.map((shape, index) => (
        <Star
          key={index}
          isEmpty={shape === 'empty'}
          name={shape === 'half' ? 'star_half' : 'star'}
          fill={shape !== 'empty'}
          size={size}
        />
      ))}
    </Root>
  );
};

export default RatingStars;
