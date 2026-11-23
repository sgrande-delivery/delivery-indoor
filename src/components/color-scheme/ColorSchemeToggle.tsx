'use client';

import React from 'react';
import { styled, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useColorSchemeMode } from 'src/hooks/use-color-scheme-mode';
import { ColorSchemeMode, COLOR_SCHEME_MODES } from 'src/theme/color-scheme';

const labels: Record<ColorSchemeMode, string> = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Sistema',
};

const Group = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: theme.vars.palette.surface.field,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5),
  gap: theme.spacing(0.5),
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: theme.shape.borderRadius,
    paddingInline: theme.spacing(2),
    textTransform: 'none',
    color: theme.vars.palette.text.secondary,
  },
  '& .MuiToggleButton-root.Mui-selected': {
    backgroundColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.primary.contrastText,
  },
  '& .MuiToggleButton-root.Mui-selected:hover': {
    backgroundColor: theme.vars.palette.primary.dark,
  },
}));

const ColorSchemeToggle: React.FC = () => {
  const { mode, isReady, setMode } = useColorSchemeMode();

  function handleChange(event: React.MouseEvent<HTMLElement>, value: ColorSchemeMode | null): void {
    if (!value) {
      return;
    }

    setMode(value);
  }

  return (
    <Group exclusive value={mode} disabled={!isReady} onChange={handleChange} aria-label="Modo de cor">
      {COLOR_SCHEME_MODES.map(option => (
        <ToggleButton key={option} value={option} aria-label={labels[option]}>
          {labels[option]}
        </ToggleButton>
      ))}
    </Group>
  );
};

export default ColorSchemeToggle;
