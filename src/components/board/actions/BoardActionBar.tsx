'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { pxToRem } from '@/theme';
import ConnectedWaiterCallButton from '@/components/waiter/ConnectedWaiterCallButton';
import { useWaiterCall } from '@/hooks/use-waiter-call';
import type { BoardMovementDetail } from '@/types/board-movement';
import { actionsMetrics } from './actions-metrics';
import OrderMoreButton from './OrderMoreButton';
import PayBillButton from './PayBillButton';

export interface BoardActionBarProps {
  movement: BoardMovementDetail;
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  gap: actionsMetrics.gap,
  paddingBlockStart: actionsMetrics.barPaddingBlockStart,
  paddingInline: actionsMetrics.barPaddingInline,
  paddingBlockEnd: actionsMetrics.barPaddingBlockEnd,
  backgroundColor: theme.vars.palette.surface.card,
  borderBlockStart: `1px solid ${theme.vars.palette.surface.line}`,
}));

const Row = styled('div')({
  display: 'flex',
  gap: actionsMetrics.gap,
});

const Cell = styled('div', {
  shouldForwardProp: prop => prop !== 'fitsContent',
})<{ fitsContent?: boolean }>(({ fitsContent = false }) => ({
  display: 'flex',
  flex: fitsContent ? '0 0 auto' : 1,
  minInlineSize: 0,
  '& > button, & > a': {
    paddingInline: actionsMetrics.rowButtonPaddingInline,
    fontSize: pxToRem(actionsMetrics.rowButtonFontSize),
  },
}));

/**
 * Fora do `Body`, que rola: pagar, chamar o garçom e pedir mais ficam à mão com a conta em qualquer posição. Com a
 * chamada feita, "Pedir mais" fica do tamanho do conteúdo e o garçom ocupa o resto, para o rótulo caber em duas linhas.
 */
const BoardActionBar: React.FC<BoardActionBarProps> = ({ movement }) => {
  const { state } = useWaiterCall();

  return (
    <Root>
      <PayBillButton movement={movement} />
      <Row>
        <Cell>
          <ConnectedWaiterCallButton fullWidth stackCalledLabel />
        </Cell>
        <Cell fitsContent={state === 'called'}>
          <OrderMoreButton />
        </Cell>
      </Row>
    </Root>
  );
};

export default BoardActionBar;
