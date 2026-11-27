'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { attendanceCopy } from '@/components/board/actions/attendance-copy';
import { Button } from '@/components/ui';
import {
  tabletPortraitMediaQuery,
  tabletPortraitShellMediaQuery,
  tabletShellMediaQuery,
} from '@/components/shell/shell-metrics';
import { controlBorderWidth, controlSizes } from '@/theme';
import { waiterCallMetrics } from './waiter-call-metrics';

const collapsedMediaQuery = `${tabletShellMediaQuery} and ${tabletPortraitMediaQuery}`;

export type WaiterCallButtonState = 'idle' | 'pending' | 'called';

export interface WaiterCallButtonProps {
  /** Sem handler o botão fica desabilitado: quem implementa a chamada é quem o liga. */
  onClick?: () => void;
  state?: WaiterCallButtonState;
  /** "HH:mm", só com `called`. */
  calledAt?: string;
  /** Em retrato de tablet o rótulo some e o botão vira um quadrado só com o ícone. */
  collapsible?: boolean;
  /** Ocupa a célula em que está (a barra do celular e as ações da página de erro). */
  fullWidth?: boolean;
  /** Na meia célula da barra do celular, "Garçom chamado às HH:mm" não cabe numa linha: vira duas linhas fixas. */
  stackCalledLabel?: boolean;
  size?: 'md' | 'lg';
  /** O rótulo curto do repouso no tablet em pé, onde a barra de ações tem três botões numa linha: "Garçom". */
  compactLabel?: string;
}

interface RootProps {
  isCollapsible: boolean;
  isCalled: boolean;
}

const Root = styled(Button, {
  shouldForwardProp: prop => prop !== 'isCollapsible' && prop !== 'isCalled',
})<RootProps>(({ theme, isCollapsible, isCalled }) => ({
  flexShrink: 0,
  backgroundColor: theme.vars.palette.surface.card,
  whiteSpace: 'nowrap',
  ...(isCalled && {
    // `&&` vence o `&.Mui-disabled` do `Button`, que pinta o desabilitado de `field` e `muted`
    '&&.Mui-disabled': {
      backgroundColor: theme.vars.palette.surface.card,
      border: `${controlBorderWidth}px solid ${theme.vars.palette.toneOnCard.success}`,
      color: theme.vars.palette.toneOnCard.success,
    },
  }),
  ...(isCollapsible && {
    [`@media ${collapsedMediaQuery}`]: {
      inlineSize: controlSizes.md.height,
      minInlineSize: controlSizes.md.height,
      paddingInline: 0,
    },
  }),
}));

const Label = styled('span', {
  shouldForwardProp: prop => prop !== 'isCollapsible',
})<{ isCollapsible: boolean }>(({ isCollapsible }) => ({
  ...(isCollapsible && {
    [`@media ${collapsedMediaQuery}`]: {
      display: 'none',
    },
  }),
}));

const Stacked = styled('span')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  lineHeight: 1.3,
  // no tablet em pé a célula do garçom é do tamanho do conteúdo: a frase cabe numa linha
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    flexDirection: 'row',
    gap: waiterCallMetrics.stackedRowGap,
  },
});

const FullLabel = styled('span')({
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    display: 'none',
  },
});

const CompactLabel = styled('span')({
  display: 'none',
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    display: 'inline',
  },
});

const WaiterCallButton: React.FC<WaiterCallButtonProps> = ({
  onClick,
  state = 'idle',
  calledAt,
  collapsible = false,
  fullWidth = false,
  stackCalledLabel = false,
  size = 'md',
  compactLabel,
}) => {
  const isCalled = state === 'called' && calledAt !== undefined;
  const label = isCalled ? attendanceCopy.waiterCalled(calledAt) : attendanceCopy.callWaiter;

  return (
    <Root
      variant="neutral"
      size={size}
      startIcon="room_service"
      aria-label={label}
      disabled={!onClick || isCalled}
      loading={state === 'pending'}
      onClick={onClick}
      fullWidth={fullWidth}
      isCollapsible={collapsible}
      isCalled={isCalled}
    >
      <Label isCollapsible={collapsible}>
        {isCalled && stackCalledLabel ? (
          <Stacked>
            <span>{attendanceCopy.waiterCalledLead}</span>
            <span>{attendanceCopy.waiterCalledAt(calledAt)}</span>
          </Stacked>
        ) : compactLabel !== undefined && !isCalled ? (
          <>
            <FullLabel>{label}</FullLabel>
            <CompactLabel>{compactLabel}</CompactLabel>
          </>
        ) : (
          label
        )}
      </Label>
    </Root>
  );
};

export default WaiterCallButton;
