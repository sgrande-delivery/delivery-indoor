'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { tabletLandscapeMediaQuery, tabletPortraitShellMediaQuery } from '@/components/shell/shell-metrics';
import { controlSizes, pxToRem } from '@/theme';
import ConnectedWaiterCallButton from '@/components/waiter/ConnectedWaiterCallButton';
import { useWaiterCall } from '@/hooks/use-waiter-call';
import type { BoardMovementDetail } from '@/types/board-movement';
import { actionsMetrics } from './actions-metrics';
import { attendanceCopy } from './attendance-copy';
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
  // em pé: uma linha só, com a barra fixa embaixo; deitado a conta tem o pagar e o "Pedir mais" na coluna da direita
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: actionsMetrics.portraitGap,
    paddingBlockStart: actionsMetrics.portraitPaddingBlockStart,
    paddingInline: actionsMetrics.portraitPaddingInline,
    paddingBlockEnd: actionsMetrics.portraitPaddingBlockEnd,
  },
  [`@media ${tabletLandscapeMediaQuery}`]: {
    display: 'none',
  },
}));

// em pé a linha some do layout e as três células ficam lado a lado, pela ordem: garçom, "Pedir mais" e pagar
const Row = styled('div')({
  display: 'flex',
  gap: actionsMetrics.gap,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    display: 'contents',
  },
});

const PayCell = styled('div')({
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    order: 3,
    flex: 1,
    minInlineSize: 0,
  },
});

const Cell = styled('div', {
  shouldForwardProp: prop => prop !== 'fitsContent' && prop !== 'portraitOrder',
})<{ fitsContent?: boolean; portraitOrder: number }>(({ fitsContent = false, portraitOrder }) => ({
  display: 'flex',
  flex: fitsContent ? '0 0 auto' : 1,
  minInlineSize: 0,
  '& > button, & > a': {
    paddingInline: actionsMetrics.rowButtonPaddingInline,
    fontSize: pxToRem(actionsMetrics.rowButtonFontSize),
  },
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    order: portraitOrder,
    flex: '0 0 auto',
    '& > button, & > a': {
      blockSize: controlSizes.lg.height,
      paddingInline: controlSizes.lg.paddingInline,
      fontSize: pxToRem(controlSizes.lg.fontSize),
    },
  },
}));

/**
 * Fora do `Body`, que rola: pagar, chamar o garçom e pedir mais ficam à mão com a conta em qualquer posição. Com a
 * chamada feita, "Pedir mais" fica do tamanho do conteúdo e o garçom ocupa o resto, para o rótulo caber em duas linhas.
 *
 * No tablet em pé os três ficam numa linha: o garçom ("Garçom"), "Pedir mais" e "Pagar conta" com o resto da largura.
 * A ordem visual vem de `order`, e o DOM segue o do celular (pagar, garçom, pedir mais). Deitado a barra some.
 */
const BoardActionBar: React.FC<BoardActionBarProps> = ({ movement }) => {
  const { state } = useWaiterCall();

  return (
    <Root>
      <PayCell>
        <PayBillButton movement={movement} />
      </PayCell>
      <Row>
        <Cell portraitOrder={1}>
          <ConnectedWaiterCallButton fullWidth stackCalledLabel compactLabel={attendanceCopy.waiterShort} />
        </Cell>
        <Cell portraitOrder={2} fitsContent={state === 'called'}>
          <OrderMoreButton />
        </Cell>
      </Row>
    </Root>
  );
};

export default BoardActionBar;
