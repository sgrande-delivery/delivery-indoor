'use client';

import { styled } from '@mui/material/styles';
import { tabletLandscapeMediaQuery, tabletPortraitShellMediaQuery } from '@/components/shell/shell-metrics';
import { boardMetrics } from '../board-metrics';
import { layoutMetrics } from './layout-metrics';

/**
 * O corpo da conta, nos três formatos com um DOM só. Celular: coluna que rola. Tablet em pé: a mesma coluna, com o
 * respiro do artboard. Tablet deitado: grade de duas colunas que não rola; quem rola são as regiões (`BoardBillMain` e
 * `BoardBillAside`), e a faixa `notice` em cima, sem altura quando vazia, leva o aviso de releitura.
 */
const BoardBody = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  gap: boardMetrics.gap,
  paddingBlockStart: boardMetrics.bodyPaddingBlockStart,
  paddingBlockEnd: boardMetrics.bodyPaddingBlockEnd,
  paddingInline: boardMetrics.paddingInline,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    gap: layoutMetrics.portraitGap,
    paddingBlock: layoutMetrics.portraitPaddingBlock,
    paddingInline: layoutMetrics.portraitPaddingInline,
  },
  [`@media ${tabletLandscapeMediaQuery}`]: {
    display: 'grid',
    gridTemplateColumns: `minmax(0, 1fr) ${layoutMetrics.landscapeAsideWidth}px`,
    gridTemplateRows: 'auto minmax(0, 1fr)',
    gridTemplateAreas: '"notice notice" "main aside"',
    gap: `0 ${layoutMetrics.landscapeGap}px`,
    overflow: 'hidden',
    paddingBlock: layoutMetrics.landscapePaddingBlock,
    paddingInline: layoutMetrics.landscapePaddingInline,
  },
});

export default BoardBody;
