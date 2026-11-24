'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { categoryListMetrics, fontFamilies, pxToRem } from '@/theme';

const END_LABEL = 'Você viu todos os itens desta categoria';

export interface CategoryListEndProps {
  label?: string;
}

const Root = styled('p')(({ theme }) => ({
  margin: 0,
  paddingBlock: categoryListMetrics.endPaddingBlock,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(categoryListMetrics.loadingFontSize),
  fontWeight: categoryListMetrics.loadingFontWeight,
  lineHeight: categoryListMetrics.loadingLineHeight,
  textAlign: 'center',
  color: theme.vars.palette.surface.muted,
}));

/**
 * O fim da lista aparece quando o servidor disse `has_more: false`. O desenho não tem este rodapé —
 * ele só desenhou o de carregamento —, então a anatomia é a mesma linha de estado, sem o esqueleto
 * e sem o spinner.
 */
const CategoryListEnd: React.FC<CategoryListEndProps> = ({ label = END_LABEL }) => {
  return <Root>{label}</Root>;
};

export default CategoryListEnd;
