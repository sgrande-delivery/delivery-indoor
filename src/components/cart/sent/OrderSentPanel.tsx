'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import { Button } from '@/components/ui';
import { useBoardSession } from '@/providers/board-session';
import { BOARD_ROUTE, HOME_ROUTE } from '@/routes/app-routes';
import { fontFamilies, pxToRem, typographyTokens } from '@/theme';
import { SentOrder } from '../use-send-order';
import { sentMetrics } from './sent-metrics';
import SentSuccessMark from './SentSuccessMark';

const BILL_LABEL = 'Ver conta da mesa';
const MENU_LABEL = 'Voltar ao cardápio';

export interface OrderSentPanelProps {
  sent: SentOrder;
}

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minBlockSize: 0,
});

const Content = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  gap: sentMetrics.panel.gap,
  paddingInline: sentMetrics.panel.paddingInline,
  textAlign: 'center',
});

const Title = styled('h1')(({ theme }) => ({
  ...typographyTokens.h3,
  margin: 0,
  outline: 'none',
  marginBlockStart: sentMetrics.panel.titleMarginBlockStart,
  color: theme.vars.palette.surface.ink,
}));

const Body = styled('p')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sentMetrics.panel.bodyFontSize),
  lineHeight: sentMetrics.panel.bodyLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const Actions = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  gap: sentMetrics.panel.actionsGap,
  paddingBlockStart: sentMetrics.panel.actionsPaddingBlockStart,
  paddingInline: sentMetrics.panel.actionsPaddingInline,
  paddingBlockEnd: sentMetrics.panel.actionsPaddingBlockEnd,
});

/** A confirmação do celular: a tela inteira, com o caminho para a conta e o de volta ao cardápio. */
const OrderSentPanel: React.FC<OrderSentPanelProps> = ({ sent }) => {
  const session = useBoardSession();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const table = session.status === 'ready' ? `Mesa ${session.movement.board.number}` : 'mesa';

  // o diálogo de nome desmonta no 201 e leva o foco; a confirmação o recebe e o leitor de tela a anuncia
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <Root>
      <Content>
        <SentSuccessMark icon="check" size={sentMetrics.panel.markSize} iconSize={sentMetrics.panel.markIconSize} />
        <Title ref={titleRef} tabIndex={-1}>{`Pedido enviado, ${sent.personFirstName}!`}</Title>
        <Body>{`A cozinha já recebeu. Os itens entraram na conta da ${table}.`}</Body>
      </Content>
      <Actions>
        <Button size="lg" fullWidth component={Link} href={BOARD_ROUTE} startIcon="receipt_long">
          {BILL_LABEL}
        </Button>
        <Button size="lg" fullWidth variant="neutral" component={Link} href={HOME_ROUTE}>
          {MENU_LABEL}
        </Button>
      </Actions>
    </Root>
  );
};

export default OrderSentPanel;
