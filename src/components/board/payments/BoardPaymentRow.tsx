'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { moneyFormat } from '@/helpers/numberFormat';
import { pxToRem, typographyTokens } from '@/theme';
import type { BoardPayment } from '@/types/board-bill';
import { formatBoardMoment } from '../board-time';
import { describePaymentTitle } from './describe-payment';
import { resolvePaymentMethodIcon } from './payment-method-icon';
import { paymentsMetrics } from './payments-metrics';

export type BoardPaymentTone = 'success' | 'ink';

export interface BoardPaymentRowProps {
  payment: BoardPayment;
  now: Date;
  tone: BoardPaymentTone;
}

const Root = styled('li')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: paymentsMetrics.rowGap,
  paddingBlock: paymentsMetrics.rowPaddingBlock,
  // o padding do cartão já dá o respiro de baixo, e somado ao da linha o cartão ficaria mais pesado embaixo
  '&:last-child': {
    paddingBlockEnd: 0,
  },
  '& + &': {
    borderBlockStart: `${paymentsMetrics.ruleHeight}px solid ${theme.vars.palette.surface.line}`,
  },
}));

const IconBox = styled('span')(({ theme }) => ({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: paymentsMetrics.iconBoxSize,
  blockSize: paymentsMetrics.iconBoxSize,
  borderRadius: paymentsMetrics.iconBoxRadius,
  backgroundColor: theme.vars.palette.surface.field,
  color: theme.vars.palette.surface.ink,
}));

const Body = styled('div')({
  flex: 1,
  minInlineSize: 0,
});

const Kind = styled('p')(({ theme }) => ({
  margin: 0,
  ...typographyTokens.subtitle2,
  fontSize: pxToRem(paymentsMetrics.kindFontSize),
  fontWeight: paymentsMetrics.kindWeight,
  color: theme.vars.palette.surface.ink,
}));

const When = styled('p')(({ theme }) => ({
  margin: 0,
  marginBlockStart: paymentsMetrics.whenMarginBlockStart,
  ...typographyTokens.caption,
  fontSize: pxToRem(paymentsMetrics.whenFontSize),
  color: theme.vars.palette.surface.muted,
}));

const Value = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: BoardPaymentTone }>(({ theme, tone }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  ...typographyTokens.subtitle1,
  fontSize: pxToRem(paymentsMetrics.valueFontSize),
  fontWeight: paymentsMetrics.valueWeight,
  color: tone === 'success' ? theme.vars.palette.toneOnCard.success : theme.vars.palette.surface.ink,
}));

const BoardPaymentRow: React.FC<BoardPaymentRowProps> = ({ payment, now, tone }) => {
  const moment = formatBoardMoment(payment.created_at, now);

  return (
    <Root>
      <IconBox>
        <Icon name={resolvePaymentMethodIcon(payment.payment_method)} size={paymentsMetrics.iconSize} />
      </IconBox>
      <Body>
        <Kind>{describePaymentTitle(payment)}</Kind>
        {moment !== null && <When>{moment}</When>}
      </Body>
      <Value tone={tone}>{moneyFormat(payment.value)}</Value>
    </Root>
  );
};

export default BoardPaymentRow;
