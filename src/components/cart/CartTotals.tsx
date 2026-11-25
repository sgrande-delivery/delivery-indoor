'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { formatCents } from '@/helpers/money';
import { cartScreenMetrics, cartSummaryMetrics, fontFamilies, interactionOpacities, pxToRem } from '@/theme';
import { Cart } from '@/types/cart';
import { CartVariant, cartFlatTotalsMetrics, cartMetrics } from './cart-metrics';

const SUBTOTAL_LABEL = 'Subtotal';
const PROMOTIONS_LABEL = 'Promoções';
const TOTAL_LABEL = 'Total do pedido';
const SERVICE_FEE_NOTE = 'Taxa de serviço calculada na conta da mesa.';
const DISCOUNT_SIGN = '−';
const NO_DISCOUNT = 0;

export interface CartTotalsProps {
  cart: Cart;
  isFetching: boolean;
  /** `screen` é o cartão do celular; `column` e `sheet` são o total solto no rodapé do tablet. */
  variant?: CartVariant;
}

interface RootProps {
  isFlat: boolean;
}

interface TotalRowProps {
  hasBreakdown: boolean;
}

const Root = styled('div', {
  shouldForwardProp: prop => prop !== 'isFlat',
})<RootProps>(({ theme, isFlat }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: cartSummaryMetrics.gap,
  ...(!isFlat && {
    marginBlockStart: cartScreenMetrics.summaryMarginBlockStart,
    padding: cartSummaryMetrics.padding,
    borderRadius: cartSummaryMetrics.radius,
    backgroundColor: theme.vars.palette.surface.card,
    boxShadow: cartSummaryMetrics.shadow,
  }),
}));

const Row = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  gap: cartSummaryMetrics.gap,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartSummaryMetrics.rowFontSize),
  lineHeight: cartSummaryMetrics.rowLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const Value = styled('span')(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  fontWeight: cartSummaryMetrics.valueWeight,
  color: theme.vars.palette.surface.ink,
}));

const DiscountValue = styled('span')(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  fontWeight: cartSummaryMetrics.accentWeight,
  color: theme.vars.palette.success.main,
}));

const TotalRow = styled('div', {
  shouldForwardProp: prop => prop !== 'hasBreakdown',
})<TotalRowProps>(({ theme, hasBreakdown }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: cartSummaryMetrics.gap,
  ...(hasBreakdown && {
    paddingBlockStart: cartSummaryMetrics.totalPaddingBlockStart,
    borderBlockStart: `${cartSummaryMetrics.totalBorderWidth}px solid ${theme.vars.palette.surface.line}`,
  }),
}));

const TotalLabel = styled('span', {
  shouldForwardProp: prop => prop !== 'fontSize',
})<{ fontSize: number }>(({ theme, fontSize }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(fontSize),
  fontWeight: cartSummaryMetrics.totalLabelWeight,
  lineHeight: cartSummaryMetrics.totalLabelLineHeight,
  color: theme.vars.palette.surface.ink,
}));

const TotalValue = styled('span', {
  shouldForwardProp: prop => prop !== 'isFetching' && prop !== 'fontSize',
})<{ isFetching: boolean; fontSize: number }>(({ theme, isFetching, fontSize }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(fontSize),
  fontWeight: cartSummaryMetrics.totalValueWeight,
  lineHeight: cartSummaryMetrics.totalValueLineHeight,
  color: theme.vars.palette.surface.ink,
  opacity: isFetching ? interactionOpacities.loading : 1,
  transition: theme.transitions.create(['opacity']),
}));

const Note = styled('p')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartMetrics.totalsNoteFontSize),
  lineHeight: cartMetrics.totalsNoteLineHeight,
  color: theme.vars.palette.surface.muted,
}));

/**
 * Tudo vem do servidor, em centavos: nada aqui soma. Subtotal e promoções só entram com desconto, porque sem elas a
 * soma das linhas não bateria com o total na frente de quem pede.
 */
const CartTotals: React.FC<CartTotalsProps> = ({ cart, isFetching, variant = 'screen' }) => {
  const hasDiscount = cart.discount > NO_DISCOUNT;
  const flat = variant === 'screen' ? null : cartFlatTotalsMetrics[variant];

  return (
    <Root isFlat={flat !== null}>
      {hasDiscount && (
        <>
          <Row>
            <span>{SUBTOTAL_LABEL}</span>
            <Value>{formatCents(cart.subtotal)}</Value>
          </Row>
          <Row>
            <span>{PROMOTIONS_LABEL}</span>
            <DiscountValue>{`${DISCOUNT_SIGN} ${formatCents(cart.discount)}`}</DiscountValue>
          </Row>
        </>
      )}
      <TotalRow hasBreakdown={hasDiscount}>
        <TotalLabel fontSize={flat?.labelFontSize ?? cartSummaryMetrics.totalLabelFontSize}>{TOTAL_LABEL}</TotalLabel>
        <TotalValue
          isFetching={isFetching}
          fontSize={flat?.valueFontSize ?? cartSummaryMetrics.totalValueFontSize}
          aria-busy={isFetching || undefined}
        >
          {formatCents(cart.total)}
        </TotalValue>
      </TotalRow>
      <Note>{SERVICE_FEE_NOTE}</Note>
    </Root>
  );
};

export default CartTotals;
