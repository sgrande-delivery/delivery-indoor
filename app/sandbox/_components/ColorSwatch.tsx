'use client';

import React from 'react';
import { styled, Typography } from '@mui/material';
import { componentRadii } from 'src/theme';

interface ColorSwatchProps {
  name: string;
  value: string;
  caption?: string;
}

const Container = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  width: 148,
}));

const Sample = styled('div')(({ theme }) => ({
  height: 56,
  borderRadius: componentRadii.input,
  border: `1px solid ${theme.vars.palette.surface.line}`,
}));

const ColorSwatch: React.FC<ColorSwatchProps> = ({ name, value, caption }) => {
  return (
    <Container>
      <Sample style={{ backgroundColor: value }} />
      <Typography variant="label">{name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Container>
  );
};

export default ColorSwatch;
