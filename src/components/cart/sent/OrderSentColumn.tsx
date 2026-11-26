'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import { Button } from '@/components/ui';
import { formatCents } from '@/helpers/money';
import { BOARD_ROUTE } from '@/routes/app-routes';
import { fontFamilies, pxToRem, typographyTokens } from '@/theme';
import { SentOrder } from '../use-send-order';
import { sentMetrics } from './sent-metrics';
import SentItemList from './SentItemList';
import SentRoundSeal from './SentRoundSeal';
import SentSuccessMark from './SentSuccessMark';

const TITLE = 'Pedido enviado';
const BILL_LABEL = 'Ver na conta da mesa';
const CONTINUE_LABEL = 'Continuar no cardápio';

export interface OrderSentColumnProps {
  sent: SentOrder;
  /** `column` é a coluna de paisagem; `sheet` é o corpo do painel de retrato, com as margens do painel. */
  variant: 'column' | 'sheet';
  onContinue: () => void;
}

interface InsetProps {
  isSheet: boolean;
}

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minBlockSize: 0,
});

const Scroll = styled('div', {
  shouldForwardProp: prop => prop !== 'isSheet',
})<InsetProps>(({ isSheet }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
  minBlockSize: 0,
  gap: sentMetrics.column.gap,
  overflowY: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  paddingBlockStart: sentMetrics.column.paddingBlockStart,
  paddingInline: isSheet ? sentMetrics.column.sheetPaddingInline : sentMetrics.column.paddingInline,
  textAlign: 'center',
}));

const Title = styled('h2')(({ theme }) => ({
  ...typographyTokens.h2,
  margin: 0,
  outline: 'none',
  marginBlockStart: sentMetrics.column.titleMarginBlockStart,
  fontSize: pxToRem(sentMetrics.column.titleFontSize),
  lineHeight: sentMetrics.column.titleLineHeight,
  color: theme.vars.palette.surface.ink,
}));

const Body = styled('p')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sentMetrics.column.bodyFontSize),
  lineHeight: sentMetrics.column.bodyLineHeight,
  color: theme.vars.palette.surface.muted,
  textWrap: 'pretty',
}));

const Items = styled('section')({
  inlineSize: '100%',
  marginBlockStart: sentMetrics.column.listMarginBlockStart,
  textAlign: 'start',
});

const Section = styled('h3')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sentMetrics.column.sectionFontSize),
  fontWeight: sentMetrics.column.sectionWeight,
  letterSpacing: sentMetrics.column.sectionLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.muted,
}));

const Actions = styled('div', {
  shouldForwardProp: prop => prop !== 'isSheet',
})<InsetProps>(({ isSheet }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  gap: sentMetrics.column.actionsGap,
  paddingBlockStart: sentMetrics.column.actionsPaddingBlockStart,
  paddingInline: isSheet ? sentMetrics.column.sheetPaddingInline : sentMetrics.column.paddingInline,
  paddingBlockEnd: sentMetrics.column.paddingBlockEnd,
}));

/**
 * A confirmação do tablet, no lugar da sacola: a coluna de paisagem e o corpo do painel de retrato. Não toma a tela, e
 * o cardápio segue navegável ao lado. O valor é o total do pedido, que é o que entrou na conta.
 */
const OrderSentColumn: React.FC<OrderSentColumnProps> = ({ sent, variant, onContinue }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isSheet = variant === 'sheet';
  const itemsLabel = `${sent.itemCount} ${sent.itemCount === 1 ? 'item' : 'itens'} · ${formatCents(sent.order.total)}`;

  // o diálogo de nome desmonta no 201 e leva o foco; a confirmação o recebe e o leitor de tela a anuncia
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <Root>
      <Scroll isSheet={isSheet}>
        <SentSuccessMark
          icon="check_circle"
          size={sentMetrics.column.markSize}
          iconSize={sentMetrics.column.markIconSize}
        />
        <Title ref={titleRef} tabIndex={-1}>
          {TITLE}
        </Title>
        <Body>{`Foi direto para a cozinha e já entrou na conta da mesa, no nome de ${sent.personFirstName}.`}</Body>
        <SentRoundSeal movementId={sent.movementId} orderId={sent.order.id} />
        <Items>
          <Section>{itemsLabel}</Section>
          <SentItemList items={sent.items} />
        </Items>
      </Scroll>
      <Actions isSheet={isSheet}>
        <Button size="lg" fullWidth component={Link} href={BOARD_ROUTE} startIcon="receipt_long">
          {BILL_LABEL}
        </Button>
        <Button size="lg" fullWidth variant="neutral" onClick={onContinue}>
          {CONTINUE_LABEL}
        </Button>
      </Actions>
    </Root>
  );
};

export default OrderSentColumn;
