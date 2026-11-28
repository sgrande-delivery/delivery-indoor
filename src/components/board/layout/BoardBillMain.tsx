'use client';

import { styled } from '@mui/material/styles';
import { tabletLandscapeMediaQuery } from '@/components/shell/shell-metrics';
import { layoutMetrics } from './layout-metrics';

/**
 * A região dos itens. No celular e em pé ela some do layout (`contents`) e os filhos entram direto na coluna do corpo.
 * Deitada, é a coluna da esquerda e rola sozinha: `minBlockSize: 0` deixa a grade cortá-la na altura da linha, e o
 * respiro com margem negativa dá espaço à sombra dos cartões, que o `overflow` cortaria.
 */
const BoardBillMain = styled('div')({
  display: 'contents',
  [`@media ${tabletLandscapeMediaQuery}`]: {
    display: 'flex',
    flexDirection: 'column',
    gridArea: 'main',
    minBlockSize: 0,
    overflowY: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    marginInline: -layoutMetrics.shadowBleedInline,
    marginBlockStart: -layoutMetrics.shadowBleedBlockStart,
    marginBlockEnd: -layoutMetrics.shadowBleedBlockEnd,
    paddingInline: layoutMetrics.shadowBleedInline,
    paddingBlockStart: layoutMetrics.shadowBleedBlockStart,
    paddingBlockEnd: layoutMetrics.shadowBleedBlockEnd,
  },
});

export default BoardBillMain;
