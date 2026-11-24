'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Button } from '@/components/ui';
import { tabletPortraitMediaQuery, tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { controlSizes } from '@/theme';

const collapsedMediaQuery = `${tabletShellMediaQuery} and ${tabletPortraitMediaQuery}`;

const WAITER_CALL_LABEL = 'Chamar garçom';

export interface WaiterCallButtonProps {
  /** Sem handler o botão fica desabilitado: quem implementa a chamada é quem o liga. */
  onClick?: () => void;
  /** Em retrato de tablet o rótulo some e o botão vira um quadrado só com o ícone. */
  collapsible?: boolean;
}

interface RootProps {
  isCollapsible: boolean;
}

const Root = styled(Button, {
  shouldForwardProp: prop => prop !== 'isCollapsible',
})<RootProps>(({ isCollapsible }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
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
})<RootProps>(({ isCollapsible }) => ({
  ...(isCollapsible && {
    [`@media ${collapsedMediaQuery}`]: {
      display: 'none',
    },
  }),
}));

const WaiterCallButton: React.FC<WaiterCallButtonProps> = ({ onClick, collapsible = false }) => {
  return (
    <Root
      variant="neutral"
      size="md"
      startIcon="room_service"
      aria-label={WAITER_CALL_LABEL}
      disabled={!onClick}
      onClick={onClick}
      isCollapsible={collapsible}
    >
      <Label isCollapsible={collapsible}>{WAITER_CALL_LABEL}</Label>
    </Root>
  );
};

export default WaiterCallButton;
