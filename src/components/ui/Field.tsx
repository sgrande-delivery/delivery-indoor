'use client';

import React from 'react';
import InputBase, { inputBaseClasses } from '@mui/material/InputBase';
import { styled } from '@mui/material/styles';
import { fontFamilies, inputMetrics, pxToRem, typographyTokens } from '@/theme';
import Icon from './Icon';
import { IconName } from './icon-names';

// A classe é o gancho público do rótulo: uma pele de campo — a escura das telas de auth, por exemplo
// — repinta o rótulo por ela, e não por `& > label`, que dependeria do elemento que o `Field`
// escolheu renderizar.
export const FIELD_LABEL_CLASS = 'Field-label';

// Os dois adornos têm o mesmo gancho pelo mesmo motivo: uma pele que só quer o glifo de entrada — ou
// só o de erro — precisa nomeá-lo, e `& > span` deixou de bastar no dia em que o campo passou a ter
// os dois de uma vez.
export const FIELD_START_ICON_CLASS = 'Field-startIcon';
export const FIELD_END_ICON_CLASS = 'Field-endIcon';

export const ERROR_ICON: IconName = 'error';

export interface FieldOwnProps {
  label?: string;
  helperText?: string;
  startIcon?: IconName;
  endIcon?: IconName;
  /**
   * Adorno final que **não** é o ícone neutro do campo: o selo `verified` do e-mail, na tela de
   * dados pessoais, é verde de status e vem preenchido. `endIcon` não serve para ele — o `FieldIcon`
   * pinta em `muted` (ou no vermelho do erro) e desenha o contorno —, e imitar o `Icon` por CSS no
   * consumidor criaria uma segunda verdade sobre a fonte de ícones.
   *
   * A precedência tem **três** degraus, e o do meio é o que surpreende: ícone de erro > `endIcon` >
   * `endSlot`. Campo em erro mostra o erro, não o selo; e campo que declara os dois mostra o
   * `endIcon` — o `endSlot` é o degrau de baixo, e não um segundo adorno ao lado do primeiro. Quem
   * precisar dos dois juntos muda o primitivo, não o consumidor.
   */
  endSlot?: React.ReactNode;
}

interface FieldStateProps {
  hasError: boolean;
}

const FieldRoot = styled('div', {
  shouldForwardProp: prop => prop !== 'hasError',
})<FieldStateProps>(({ theme, hasError }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minWidth: 0,
  ...(hasError
    ? {}
    : {
        [`&:focus-within .${FIELD_LABEL_CLASS}`]: {
          color: theme.vars.palette.brand.text,
        },
      }),
}));

const FieldLabel = styled('label', {
  shouldForwardProp: prop => prop !== 'hasError',
})<FieldStateProps>(({ theme, hasError }) => ({
  ...typographyTokens.label,
  marginBottom: inputMetrics.labelGap,
  color: hasError ? theme.vars.palette.error.main : theme.vars.palette.surface.muted,
  transition: theme.transitions.create(['color']),
}));

const FieldHelperText = styled('p', {
  shouldForwardProp: prop => prop !== 'hasError',
})<FieldStateProps>(({ theme, hasError }) => ({
  margin: 0,
  marginTop: inputMetrics.helperGap,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(inputMetrics.helperFontSize),
  fontWeight: inputMetrics.helperFontWeight,
  lineHeight: inputMetrics.helperLineHeight,
  color: hasError ? theme.vars.palette.error.main : theme.vars.palette.surface.muted,
}));

export const FieldControl = styled(InputBase)(({ theme }) => ({
  width: '100%',
  minHeight: inputMetrics.height,
  paddingInline: inputMetrics.paddingInline,
  gap: inputMetrics.iconGap,
  borderRadius: inputMetrics.radius,
  border: `${inputMetrics.borderWidth}px solid transparent`,
  backgroundColor: theme.vars.palette.surface.field,
  color: theme.vars.palette.surface.ink,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(inputMetrics.fontSize),
  fontWeight: inputMetrics.fontWeight,
  lineHeight: inputMetrics.lineHeight,
  transition: theme.transitions.create(['background-color', 'border-color', 'color']),
  [`&.${inputBaseClasses.focused}`]: {
    backgroundColor: theme.vars.palette.surface.card,
    borderColor: theme.vars.palette.primary.main,
  },
  [`&.${inputBaseClasses.error}`]: {
    backgroundColor: theme.vars.palette.surface.card,
    borderColor: theme.vars.palette.error.main,
  },
  [`&.${inputBaseClasses.disabled}`]: {
    backgroundColor: theme.vars.palette.surface.field,
    borderColor: 'transparent',
    color: theme.vars.palette.surface.muted,
  },
  [`& .${inputBaseClasses.input}`]: {
    height: 'auto',
    padding: 0,
    '&::placeholder': {
      color: theme.vars.palette.surface.muted,
      opacity: 1,
    },
    [`&.${inputBaseClasses.disabled}`]: {
      WebkitTextFillColor: theme.vars.palette.surface.muted,
      color: theme.vars.palette.surface.muted,
    },
  },
}));

const FieldAdornment = styled('span', {
  shouldForwardProp: prop => prop !== 'hasError',
})<FieldStateProps>(({ theme, hasError }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  color: hasError ? theme.vars.palette.error.main : theme.vars.palette.surface.muted,
}));

export type FieldIconPlacement = 'start' | 'end';

export interface FieldAdornmentIconProps {
  name: IconName;
  placement: FieldIconPlacement;
  hasError: boolean;
}

const FIELD_ICON_CLASSES: Record<FieldIconPlacement, string> = {
  start: FIELD_START_ICON_CLASS,
  end: FIELD_END_ICON_CLASS,
};

export const FieldIcon: React.FC<FieldAdornmentIconProps> = ({ name, placement, hasError }) => {
  return (
    <FieldAdornment className={FIELD_ICON_CLASSES[placement]} hasError={hasError}>
      <Icon name={name} size={inputMetrics.iconSize} />
    </FieldAdornment>
  );
};

export interface FieldShellProps extends React.HTMLAttributes<HTMLDivElement>, FieldStateProps {
  rootComponent?: React.ElementType;
  controlId: string;
  helperId?: string;
  label?: string;
  helperText?: string;
  isControlLabelable?: boolean;
}

const FieldShell = React.forwardRef<HTMLDivElement, FieldShellProps>(function FieldShell(props, ref) {
  const {
    rootComponent,
    controlId,
    helperId,
    label,
    helperText,
    hasError,
    isControlLabelable = true,
    children,
    ...rest
  } = props;

  return (
    <FieldRoot ref={ref} as={rootComponent} hasError={hasError} {...rest}>
      {label && (
        <FieldLabel
          className={FIELD_LABEL_CLASS}
          htmlFor={isControlLabelable ? controlId : undefined}
          hasError={hasError}
        >
          {label}
        </FieldLabel>
      )}
      {children}
      {helperText && (
        <FieldHelperText id={helperId} hasError={hasError}>
          {helperText}
        </FieldHelperText>
      )}
    </FieldRoot>
  );
});

export default FieldShell;
