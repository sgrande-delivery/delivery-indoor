'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon, IconName } from '@/components/ui';
import { fontFamilies, productMetaChipMetrics, pxToRem } from '@/theme';

export interface ProductMetaChipProps {
  icon: IconName;
  children: React.ReactNode;
}

/**
 * **Não é o `Chip` do design system**, de propósito: o primitivo é um `ButtonBase` — renderiza um
 * controle, com foco e ativação —, e porção e caloria são texto estático, que ninguém pressiona.
 *
 * O `aria-pressed` incondicional que o aprendizado do épico registra **já caiu na task 43**
 * (`d3f6c2c`): hoje o `Chip` só emite `aria-pressed` com `selected` e `aria-current` com `current`.
 * O motivo de não reusá-lo aqui é o outro — e a pele também diverge: com ícone o `Chip` troca o
 * fundo `card` com borda `line` por `field` sem borda, e o design da chip de metadado pede o
 * primeiro.
 */
const Root = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: productMetaChipMetrics.gap,
  paddingBlock: productMetaChipMetrics.paddingBlock,
  paddingInline: productMetaChipMetrics.paddingInline,
  border: `${productMetaChipMetrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
  borderRadius: productMetaChipMetrics.radius,
  backgroundColor: theme.vars.palette.surface.card,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productMetaChipMetrics.fontSize),
  fontWeight: productMetaChipMetrics.fontWeight,
  color: theme.vars.palette.surface.ink,
}));

const Glyph = styled(Icon)(({ theme }) => ({
  color: theme.vars.palette.primary.main,
}));

const ProductMetaChip: React.FC<ProductMetaChipProps> = ({ icon, children }) => {
  return (
    <Root>
      <Glyph name={icon} size={productMetaChipMetrics.iconSize} />
      {children}
    </Root>
  );
};

export default ProductMetaChip;
