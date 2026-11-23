'use client';

import React, { PropsWithChildren } from 'react';
import { styled, Typography } from '@mui/material';

interface SandboxSectionProps {
  title: string;
  description?: string;
}

const Container = styled('section')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const Header = styled('header')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const Content = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
}));

const SandboxSection: React.FC<PropsWithChildren<SandboxSectionProps>> = ({ title, description, children }) => {
  return (
    <Container>
      <Header>
        <Typography variant="h2">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Header>
      <Content>{children}</Content>
    </Container>
  );
};

export default SandboxSection;
