'use client';

import React from 'react';
import { styled, Typography } from '@mui/material';
import SandboxSection from './SandboxSection';
import BrandPanel from './BrandPanel';
import ColorSchemePanel from './ColorSchemePanel';

const Container = styled('div')(({ theme }) => ({
  blockSize: '100%',
  width: '100%',
  overflowY: 'auto',
  backgroundColor: theme.vars.palette.background.default,
  color: theme.vars.palette.text.primary,
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(5),
}));

const Header = styled('header')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const ThemeSandbox: React.FC = () => {
  return (
    <Container>
      <Header>
        <Typography variant="h1">Sandbox de tema</Typography>
        <Typography variant="body1" color="text.secondary">
          Escala de tokens da camada src/theme. O modo claro ou escuro segue o seletor abaixo, com o sistema operacional
          como default.
        </Typography>
      </Header>

      <SandboxSection
        title="Modo de cor"
        description="Três estados, persistidos pelo MUI. Onde o seletor mora em produção é decisão de produto."
      >
        <ColorSchemePanel />
      </SandboxSection>

      <SandboxSection
        title="Marca"
        description="Derivada do hex do restaurante, com fallback no default do design. O contrastText é escolhido por razão de contraste contra o main."
      >
        <BrandPanel />
      </SandboxSection>
    </Container>
  );
};

export default ThemeSandbox;
