'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { moneyFormat } from '@/helpers/numberFormat';
import {
  tabletLandscapeMediaQuery,
  tabletPortraitShellMediaQuery,
  tabletShellMediaQuery,
} from '@/components/shell/shell-metrics';
import { fontFamilies, pxToRem, typographyTokens } from '@/theme';
import type { BoardMovementDetail } from '@/types/board-movement';
import { useNow } from '@/hooks/use-now';
import { resolveAmountDue, resolvePaidPercent } from '../bill-amounts';
import { formatBoardClock, parseBoardTimestamp } from '../board-time';
import { phoneOnlyStyle, tabletOnlyStyle } from '../layout/format-visibility';
import BillCardShell from './BillCardShell';
import BillProgress from './BillProgress';
import BillStateLabel from './BillStateLabel';
import BillTimeRow from './BillTimeRow';
import { billCardMetrics } from './bill-card-metrics';
import { BillState, describeBillState, describeBoardPrefix } from './bill-state';
import { formatElapsed } from './format-duration';

export interface BillCardOpenProps {
  movement: BoardMovementDetail;
  boardNumber: string;
  state: Exclude<BillState, 'paid'>;
  action?: React.ReactNode;
}

/**
 * Um DOM, três formas. Celular: a coluna de sempre. Tablet: os filhos de `Values` e de `PaidLine` viram itens da grade
 * (`display: contents`), e cada um ocupa uma área. Deitado, o rótulo e o contador na primeira linha, o valor à
 * esquerda e "pagos / de" à direita, e a barra. Em pé, duas colunas internas: rótulo e valor à esquerda; "pagos / de",
 * a barra e o contador à direita, encostados embaixo.
 */
const Card = styled(BillCardShell)({
  [`@media ${tabletLandscapeMediaQuery}`]: {
    paddingInline: billCardMetrics.landscapePaddingInline,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gridTemplateRows: 'auto 1fr auto auto auto',
    gridTemplateAreas: '"label time" "due paid" "due total" "bar bar" "action action"',
    alignItems: 'start',
  },
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    columnGap: billCardMetrics.portraitColumnGap,
    gridTemplateRows: 'auto 1fr auto auto auto auto',
    gridTemplateAreas:
      '"label label label label" "due due . ." "due due paid total" "due due bar bar" "due due time time" "action action action action"',
    alignItems: 'start',
  },
});

const StateLabel = styled(BillStateLabel)({
  [`@media ${tabletShellMediaQuery}`]: {
    gridArea: 'label',
  },
});

// o número da mesa sai deitado: a barra superior já mostra "Mesa N"
const TableNumber = styled('span')({
  [`@media ${tabletLandscapeMediaQuery}`]: {
    display: 'none',
  },
});

const Progress = styled(BillProgress)({
  [`@media ${tabletShellMediaQuery}`]: {
    gridArea: 'bar',
  },
  [`@media ${tabletLandscapeMediaQuery}`]: {
    marginBlockStart: billCardMetrics.landscapeProgressMarginBlockStart,
  },
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    marginBlockStart: billCardMetrics.portraitRightGap,
  },
});

const Counter = styled(BillTimeRow)({
  [`@media ${tabletLandscapeMediaQuery}`]: {
    gridArea: 'time',
    justifySelf: 'end',
  },
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    gridArea: 'time',
    justifySelf: 'start',
    marginBlockStart: billCardMetrics.portraitRightGap,
  },
});

const Values = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: `${billCardMetrics.valuesRowGap}px ${billCardMetrics.valuesGap}px`,
  marginBlockStart: billCardMetrics.valuesMarginBlockStart,
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'contents',
  },
});

const Due = styled('div')({
  display: 'flex',
  minInlineSize: 0,
  flexDirection: 'column',
  [`@media ${tabletShellMediaQuery}`]: {
    gridArea: 'due',
    marginBlockStart: billCardMetrics.tabletDueMarginBlockStart,
  },
  [`@media ${tabletLandscapeMediaQuery}`]: {
    marginBlockStart: billCardMetrics.tabletValuesMarginBlockStart,
  },
});

const Total = styled('div')({
  display: 'flex',
  minInlineSize: 0,
  marginInlineStart: 'auto',
  flexDirection: 'column',
  alignItems: 'flex-end',
  [`@media ${tabletShellMediaQuery}`]: {
    gridArea: 'total',
    justifySelf: 'end',
  },
});

const Caption = styled('span')(({ theme }) => ({
  ...typographyTokens.caption,
  color: theme.vars.palette.surface.muted,
}));

// "Total" é rótulo do celular; no tablet o valor se lê "de R$ 155,43", ao lado do "R$ 60,00 pagos"
const TotalCaption = styled(Caption)(phoneOnlyStyle);

const TotalPrefix = styled('span')(tabletOnlyStyle('inline'));

const DueValue = styled('span')(({ theme }) => ({
  ...typographyTokens.h1,
  color: theme.vars.palette.surface.ink,
}));

const TotalValue = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.totalFontSize),
  fontWeight: billCardMetrics.totalWeight,
  color: theme.vars.palette.surface.ink,
  [`@media ${tabletShellMediaQuery}`]: {
    fontSize: pxToRem(billCardMetrics.paidLineFontSize),
    fontWeight: billCardMetrics.tabletTotalWeight,
    color: theme.vars.palette.surface.muted,
  },
  [`@media ${tabletLandscapeMediaQuery}`]: {
    fontWeight: billCardMetrics.landscapeTotalWeight,
  },
}));

const PaidLine = styled('div')({
  display: 'flex',
  marginBlockStart: billCardMetrics.paidLineMarginBlockStart,
  alignItems: 'center',
  justifyContent: 'space-between',
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'contents',
  },
});

const PaidAmount = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.paidLineFontSize),
  fontWeight: billCardMetrics.paidLineWeight,
  color: theme.vars.palette.toneOnCard.success,
  [`@media ${tabletShellMediaQuery}`]: {
    gridArea: 'paid',
  },
  [`@media ${tabletLandscapeMediaQuery}`]: {
    justifySelf: 'end',
    alignSelf: 'end',
  },
}));

const PaidPercent = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(billCardMetrics.paidLineFontSize),
  fontWeight: billCardMetrics.paidLineWeight,
  color: theme.vars.palette.surface.muted,
  // o artboard do tablet não desenha o percentual: a barra e "pagos / de" já dizem
  ...phoneOnlyStyle,
}));

const ActionSlot = styled('div')({
  marginBlockStart: billCardMetrics.actionMarginBlockStart,
  [`@media ${tabletShellMediaQuery}`]: {
    gridArea: 'action',
    alignSelf: 'stretch',
  },
});

const BillCardOpen: React.FC<BillCardOpenProps> = ({ movement, boardNumber, state, action }) => {
  const now = useNow(billCardMetrics.tickMs);
  const percent = resolvePaidPercent(movement);
  const openedAt = parseBoardTimestamp(movement.opened_at);
  const openedClock = formatBoardClock(movement.opened_at, now);

  return (
    <Card>
      <StateLabel>
        <TableNumber>{describeBoardPrefix(boardNumber)}</TableNumber>
        {describeBillState(state)}
      </StateLabel>
      <Values>
        <Due>
          <Caption>Falta pagar</Caption>
          <DueValue>{moneyFormat(resolveAmountDue(movement))}</DueValue>
        </Due>
        <Total>
          <TotalCaption>Total</TotalCaption>
          <TotalValue>
            <TotalPrefix>de </TotalPrefix>
            {moneyFormat(movement.total_due)}
          </TotalValue>
        </Total>
      </Values>
      <Progress percent={percent} />
      <PaidLine>
        <PaidAmount>{moneyFormat(movement.total_paid)} pagos</PaidAmount>
        <PaidPercent>{percent}%</PaidPercent>
      </PaidLine>
      {action !== undefined && <ActionSlot>{action}</ActionSlot>}
      {openedAt !== null && (
        <Counter
          label="Mesa ocupada há"
          value={formatElapsed(openedAt, now.getTime())}
          aside={openedClock === null ? null : `desde ${openedClock}`}
          compactOnTablet
        />
      )}
    </Card>
  );
};

export default BillCardOpen;
