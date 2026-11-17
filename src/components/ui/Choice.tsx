'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { choiceMetrics, focusRing, fontFamilies, interactionOpacities, pxToRem } from '@/theme';
import Icon from './Icon';
import { IconName } from './icon-names';

// As duas classes são o gancho público dos glifos: quem precisar de outra pele — o aceite de termos
// da superfície escura de auth é o primeiro caso — repinta marcado e desmarcado por elas, sem
// depender da ordem dos filhos nem do elemento que o `Icon` renderiza.
export const CHECKED_GLYPH_CLASS = 'Choice-glyphChecked';
export const UNCHECKED_GLYPH_CLASS = 'Choice-glyphUnchecked';

export interface ChoiceOwnProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'children' | 'size' | 'type'
> {
  label?: string;
  // Tamanho do glifo. O design usa 24 nos controles soltos e 21 nas linhas de grupo de opção e de
  // ingrediente; o `size` nativo do input já sai do tipo pelo `Omit`, então o nome está livre.
  size?: number;
  /**
   * O glifo **marcado** preenchido — `check_box` e `radio_button_checked` no eixo `FILL 1`, que é a
   * caixa sólida com o tique vazado. O aceite do cadastro de endereço é o primeiro consumidor.
   *
   * Ele é prop e não CSS no consumidor porque `fontVariationSettings` é uma string **única**: quem a
   * reescreve de fora precisa repetir `wght`, `GRAD` e, principalmente, o `opsz` — que o `Icon`
   * deriva do `size`. Um `opsz` escrito à mão sai do lugar no dia em que o `size` do call site mudar,
   * sem nada acusar. Aqui os dois continuam saindo da mesma fonte.
   */
  fill?: boolean;
}

interface ChoiceProps extends ChoiceOwnProps {
  checkedIcon: IconName;
  type: 'checkbox' | 'radio';
  uncheckedIcon: IconName;
}

interface RootProps {
  isDisabled: boolean;
}

const Root = styled('label', {
  shouldForwardProp: prop => prop !== 'isDisabled',
})<RootProps>(({ theme, isDisabled }) => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: choiceMetrics.gap,
  cursor: isDisabled ? 'default' : 'pointer',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(choiceMetrics.fontSize),
  fontWeight: choiceMetrics.fontWeight,
  color: isDisabled ? theme.vars.palette.surface.muted : theme.vars.palette.surface.ink,
  transition: theme.transitions.create(['color']),
  [`& .${UNCHECKED_GLYPH_CLASS}`]: {
    color: theme.vars.palette.surface.muted,
  },
  [`& .${CHECKED_GLYPH_CLASS}`]: {
    display: 'none',
    color: theme.vars.palette.primary.main,
  },
  [`& input:checked ~ .${UNCHECKED_GLYPH_CLASS}`]: {
    display: 'none',
  },
  [`& input:checked ~ .${CHECKED_GLYPH_CLASS}`]: {
    display: 'inline-block',
  },
  [`& input:focus-visible ~ .${UNCHECKED_GLYPH_CLASS}, & input:focus-visible ~ .${CHECKED_GLYPH_CLASS}`]: {
    borderRadius: choiceMetrics.focusRadius,
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  ...(isDisabled
    ? {
        [`& .${UNCHECKED_GLYPH_CLASS}, & .${CHECKED_GLYPH_CLASS}`]: {
          opacity: interactionOpacities.disabled,
        },
      }
    : {}),
}));

const NativeInput = styled('input')({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  opacity: 0,
  cursor: 'inherit',
});

const Choice = React.forwardRef<HTMLInputElement, ChoiceProps>(function Choice(props, ref) {
  const {
    checkedIcon,
    uncheckedIcon,
    type,
    label,
    className,
    style,
    size = choiceMetrics.glyphSize,
    disabled = false,
    fill = false,
    ...rest
  } = props;

  return (
    <Root className={className} style={style} isDisabled={disabled}>
      <NativeInput ref={ref} {...rest} type={type} disabled={disabled} />
      <Icon className={UNCHECKED_GLYPH_CLASS} name={uncheckedIcon} size={size} />
      <Icon className={CHECKED_GLYPH_CLASS} name={checkedIcon} size={size} fill={fill} />
      {label && <span>{label}</span>}
    </Root>
  );
});

export default Choice;
