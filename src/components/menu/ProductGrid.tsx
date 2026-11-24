'use client';

import { styled } from '@mui/material/styles';
import { tabletPortraitShellMediaQuery } from '@/components/shell/shell-metrics';
import { productGridMetrics as metrics } from './product-grid-metrics';

// `minmax(0, 1fr)`: com `1fr` puro, um nome sem quebra empurraria a coluna e a grade ganharia rolagem horizontal.
// O 3/2 é o mesmo corte por orientação com que o shell troca a coluna da sacola pela barra.
const ProductGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: `repeat(${metrics.columns.landscape}, minmax(0, 1fr))`,
  gap: metrics.gap,
  paddingInline: metrics.gutter.landscape,
  paddingBlockEnd: metrics.gutter.landscape,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    gridTemplateColumns: `repeat(${metrics.columns.portrait}, minmax(0, 1fr))`,
    paddingInline: metrics.gutter.portrait,
    paddingBlockEnd: metrics.gutter.portrait,
  },
});

export default ProductGrid;
