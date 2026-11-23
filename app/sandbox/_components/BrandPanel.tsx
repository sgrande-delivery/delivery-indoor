'use client';

import React from 'react';
import { styled, Typography } from '@mui/material';
import { BrandColor, componentRadii, contrastRatio, DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR } from 'src/theme';
import { BrandingSource, createBranding } from 'src/branding/branding';
import { Button } from 'src/components/ui';
import { useRestaurant } from 'src/hooks/use-restaurant';
import ColorSwatch from './ColorSwatch';

interface BrandColorRowProps {
  name: string;
  color: BrandColor;
  source: BrandingSource;
  showCssButton?: boolean;
}

const Container = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  width: '100%',
}));

const Row = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const Sources = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const Swatches = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
}));

const Samples = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const Sample = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 52,
  paddingInline: 24,
  borderRadius: componentRadii.button,
  width: 'fit-content',
});

const sourceLabels: Record<BrandingSource, string> = {
  restaurant: 'restaurante',
  default: 'default do design',
};

function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

function formatPair(primaryColor?: string | null, secondaryColor?: string | null): string {
  return `${primaryColor ?? 'ausente'} e ${secondaryColor ?? 'ausente'}`;
}

const BrandColorRow: React.FC<BrandColorRowProps> = ({ name, color, source, showCssButton }) => {
  return (
    <Row>
      <Typography variant="h3">{name}</Typography>
      <Typography variant="body2" color="text.secondary">
        origem em uso: {sourceLabels[source]}
      </Typography>
      <Swatches>
        <ColorSwatch name="main" value={color.main} />
        <ColorSwatch name="light" value={color.light} />
        <ColorSwatch name="dark" value={color.dark} />
        <ColorSwatch
          name="contrastText"
          value={color.contrastText}
          caption={formatRatio(contrastRatio(color.main, color.contrastText))}
        />
      </Swatches>
      <Samples>
        <Sample style={{ backgroundColor: color.main, color: color.contrastText }}>
          <Typography variant="button">Finalizar pedido</Typography>
        </Sample>
        {showCssButton && <Button variant="primary">Finalizar pedido</Button>}
      </Samples>
    </Row>
  );
};

const BrandPanel: React.FC = () => {
  const { data: restaurant, status } = useRestaurant();
  const { palette, paletteSource } = createBranding(restaurant ?? null);

  return (
    <Container>
      <Sources>
        <Typography variant="body2" color="text.secondary">
          status da query: {status}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          1. restaurante — {formatPair(restaurant?.primary_color, restaurant?.secondary_color)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          2. default do design — {formatPair(DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR)}
        </Typography>
        <Typography variant="body2">
          Cada cor resolve independente: primary vem de {sourceLabels[paletteSource.primary]} e secondary de{' '}
          {sourceLabels[paletteSource.secondary]}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Na primary, a amostra à esquerda é o hex calculado em JS e o botão à direita lê a variável CSS. Os dois têm de
          bater.
        </Typography>
      </Sources>
      <BrandColorRow name="primary" color={palette.primary} source={paletteSource.primary} showCssButton />
      <BrandColorRow name="secondary" color={palette.secondary} source={paletteSource.secondary} />
    </Container>
  );
};

export default BrandPanel;
