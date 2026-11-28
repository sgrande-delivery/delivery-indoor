'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { tabletLandscapeMediaQuery } from '@/components/shell/shell-metrics';
import { LandscapeOnly } from './format-visibility';
import { layoutMetrics } from './layout-metrics';

export interface BoardBillAsideProps {
  /** O card de destaque, ou o encerramento da conta paga. Aparece em todo formato. */
  card: React.ReactNode;
  /**
   * O lugar do pagamento, só no tablet deitado, entre o card e `secondary`. Quem o ocupa traz o próprio estado offline:
   * a região não desenha frase nenhuma. A conta paga não passa nada.
   */
  payment?: React.ReactNode;
  /** A ação que fica embaixo do lugar do pagamento ("Pedir mais"), só no tablet deitado. */
  secondary?: React.ReactNode;
}

/**
 * A região do card. No celular e em pé é só o card, no topo da coluna. Deitada, é a coluna da direita (440) e rola
 * sozinha, com o card, o lugar do pagamento e a ação secundária, como no desktop.
 */
const Root = styled('div')({
  display: 'contents',
  [`@media ${tabletLandscapeMediaQuery}`]: {
    display: 'flex',
    flexDirection: 'column',
    gap: layoutMetrics.asideGap,
    gridArea: 'aside',
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

const BoardBillAside: React.FC<BoardBillAsideProps> = ({ card, payment, secondary }) => {
  return (
    <Root>
      {card}
      {payment !== undefined && <LandscapeOnly>{payment}</LandscapeOnly>}
      {secondary !== undefined && <LandscapeOnly>{secondary}</LandscapeOnly>}
    </Root>
  );
};

export default BoardBillAside;
