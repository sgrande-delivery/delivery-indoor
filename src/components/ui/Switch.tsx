'use client';

import React from 'react';
import ButtonBase, { ExtendButtonBase, ExtendButtonBaseTypeMap } from '@mui/material/ButtonBase';
import { OverrideProps } from '@mui/material/OverridableComponent';
import { styled } from '@mui/material/styles';
import { focusRing, interactionOpacities, switchMetrics } from '@/theme';

export interface SwitchOwnProps {
  checked: boolean;
  children?: never;
}

export interface SwitchTypeMap<RootComponent extends React.ElementType = 'button'> {
  props: SwitchOwnProps;
  defaultComponent: RootComponent;
}

export type SwitchProps<RootComponent extends React.ElementType = 'button'> = OverrideProps<
  ExtendButtonBaseTypeMap<SwitchTypeMap<RootComponent>>,
  RootComponent
>;

interface TrackProps {
  isChecked: boolean;
}

const Track = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'isChecked',
})<TrackProps>(({ theme, isChecked }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flexShrink: 0,
  inlineSize: switchMetrics.trackInlineSize,
  blockSize: switchMetrics.trackBlockSize,
  paddingInline: switchMetrics.trackPaddingInline,
  borderRadius: switchMetrics.trackRadius,
  backgroundColor: isChecked ? theme.vars.palette.primary.main : theme.vars.palette.surface.line,
  transition: theme.transitions.create(['background-color']),
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  '&.Mui-disabled': {
    opacity: interactionOpacities.disabled,
  },
}));

/**
 * O botão anda por `transform`, e não por `justify-content`: só assim o movimento é animável, e é ele
 * — não a cor do trilho — que anuncia o estado a quem não distingue as duas cores.
 */
const Thumb = styled('span', {
  shouldForwardProp: prop => prop !== 'isChecked',
})<TrackProps>(({ theme, isChecked }) => ({
  display: 'block',
  inlineSize: switchMetrics.thumbSize,
  blockSize: switchMetrics.thumbSize,
  borderRadius: switchMetrics.thumbRadius,
  border: `${switchMetrics.thumbBorderWidth}px solid ${theme.vars.palette.surface.ink}`,
  backgroundColor: switchMetrics.thumbColor,
  boxSizing: 'border-box',
  transform: isChecked ? `translateX(${switchMetrics.thumbTravel}px)` : 'none',
  transition: theme.transitions.create(['transform']),
}));

/**
 * O toggle do design system. Ele **não carrega texto**: quem o nomeia é o rótulo da linha em que ele
 * mora, por `aria-labelledby` — na tela 7 são as linhas de Notificações e de Tema escuro.
 *
 * Molde de tipagem: é controle clicável, então segue o primeiro dos três moldes do épico —
 * `ButtonBase` com `ExtendButtonBase` —, como o `Chip` e o `MenuListItem`. A semântica é
 * `role="switch"` com `aria-checked`, que é o que faz `Space` e `Enter` alternarem e o leitor de tela
 * anunciar "ativado"/"desativado" em vez de "botão".
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(props, ref) {
  const { checked, ...rest } = props;

  return (
    <Track ref={ref} {...rest} role="switch" aria-checked={checked} isChecked={checked}>
      <Thumb isChecked={checked} />
    </Track>
  );
}) as ExtendButtonBase<SwitchTypeMap>;

export default Switch;
