'use client';

import React from 'react';
import { styled, Typography } from '@mui/material';
import ColorSchemeToggle from 'src/components/color-scheme/ColorSchemeToggle';
import { useColorSchemeMode } from 'src/hooks/use-color-scheme-mode';

const Container = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  width: '100%',
}));

const ColorSchemePanel: React.FC = () => {
  const { mode, resolvedScheme, isReady } = useColorSchemeMode();

  return (
    <Container>
      <ColorSchemeToggle />
      <Typography variant="body2" color="text.secondary">
        mode {mode} · esquema aplicado {resolvedScheme ?? 'indefinido ate a hidratacao'} · hidratado{' '}
        {isReady ? 'sim' : 'nao'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        A escolha e persistida pelo MUI em localStorage mui-mode e relida pelo InitColorSchemeScript antes do primeiro
        paint.
      </Typography>
    </Container>
  );
};

export default ColorSchemePanel;
