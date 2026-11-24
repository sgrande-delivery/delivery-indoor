'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { productMetaChipMetrics } from '@/theme';
import ProductMetaChip from './ProductMetaChip';

const CALORIES_SUFFIX = 'kcal';
const SERVES_PREFIX = 'Serve';

const numberFormatter = new Intl.NumberFormat('pt-BR');

export interface ProductMetaChipsProps {
  serves: number | null;
  calories: number | null;
}

const Root = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: productMetaChipMetrics.listGap,
  marginBlockStart: productMetaChipMetrics.marginBlockStart,
});

function describeServes(serves: number): string {
  return `${SERVES_PREFIX} ${serves} ${serves === 1 ? 'pessoa' : 'pessoas'}`;
}

/**
 * As duas chips que têm fonte de dado. A terceira do design — "Contém glúten, leite" — **não
 * entra**: a API não tem campo de alérgenos; inventar placeholder seria
 * afirmar composição de alimento que ninguém informou.
 *
 * `calories` e `serves` chegam `null` em todo o tenant de dev. Cada chip é condicional ao seu campo
 * e a linha inteira some quando os dois faltam, sem espaço reservado.
 */
const ProductMetaChips: React.FC<ProductMetaChipsProps> = ({ serves, calories }) => {
  if (serves === null && calories === null) {
    return null;
  }

  return (
    <Root>
      {serves !== null && <ProductMetaChip icon="group">{describeServes(serves)}</ProductMetaChip>}
      {calories !== null && (
        <ProductMetaChip icon="local_fire_department">
          {numberFormatter.format(calories)} {CALORIES_SUFFIX}
        </ProductMetaChip>
      )}
    </Root>
  );
};

export default ProductMetaChips;
