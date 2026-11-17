'use client';

import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import ButtonBase, { ExtendButtonBase, ExtendButtonBaseTypeMap } from '@mui/material/ButtonBase';
import { OverrideProps } from '@mui/material/OverridableComponent';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import {
  buttonMetrics,
  controlBorderWidth,
  controlGap,
  controlSizes,
  ControlSizeName,
  focusRing,
  HOVER_MEDIA_QUERY,
  interactionOpacities,
  pxToRem,
  typographyTokens,
} from '@/theme';
import Icon from './Icon';
import { IconName } from './icon-names';

/**
 * `neutral` é a pele do `Cancelar` dos sheets — borda 1,5px em `line` e texto `ink`, a mesma que a
 * chip `neutral` usa. Ela entrou com dois consumidores no desenho (o rodapé do sheet de ordenação e
 * o do sheet de filtros da busca) e sem ela cada rodapé escreveria o seu, que é o fork que a task
 * 52 existiu para desfazer — a diferença é que aqui a pele **não** é de marca: `secondary` já é a
 * borda em `brand`, e usar ela pintaria de laranja um botão que o desenho quer neutro.
 *
 * `inverse` é sólido em tinta — fundo `surface.ink`, texto `surface.page` —, o CTA `Entendi, quero
 * testar` do sheet de primeiro acesso (#181). Nenhuma das outras é sólida fora da marca: `primary` é
 * o laranja, e o desenho quer o botão da cor do texto, que no escuro inverte junto com ele. O hover
 * é a tinta pelo canal com `interactionOpacities.solid`, como as variantes de contorno fazem com o
 * `tint`: `text.primary` do tema **é** `surface.ink`, e é dele que o MUI publica o canal.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'ghost' | 'destructive' | 'inverse';

export type ButtonSize = ControlSizeName;

export interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  startIcon?: IconName;
  endIcon?: IconName;
  loading?: boolean;
}

export interface ButtonTypeMap<RootComponent extends React.ElementType = 'button'> {
  props: ButtonOwnProps;
  defaultComponent: RootComponent;
}

export type ButtonProps<RootComponent extends React.ElementType = 'button'> = OverrideProps<
  ExtendButtonBaseTypeMap<ButtonTypeMap<RootComponent>>,
  RootComponent
>;

interface RootProps {
  buttonVariant: ButtonVariant;
  buttonSize: ButtonSize;
  isFullWidth: boolean;
  isLoading: boolean;
}

interface ContentProps {
  isLoading: boolean;
}

const variantStyles: Record<ButtonVariant, (theme: Theme) => CSSObject> = {
  primary: theme => ({
    backgroundColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.primary.contrastText,
    boxShadow: buttonMetrics.primaryShadow,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: theme.vars.palette.primary.dark,
      },
    },
  }),
  secondary: theme => ({
    border: `${controlBorderWidth}px solid ${theme.vars.palette.primary.main}`,
    color: theme.vars.palette.brand.text,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / ${interactionOpacities.tint})`,
      },
    },
  }),
  neutral: theme => ({
    border: `${controlBorderWidth}px solid ${theme.vars.palette.surface.line}`,
    color: theme.vars.palette.surface.ink,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: theme.vars.palette.surface.field,
      },
    },
  }),
  ghost: theme => ({
    color: theme.vars.palette.brand.text,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / ${interactionOpacities.tint})`,
      },
    },
  }),
  destructive: theme => ({
    border: `${controlBorderWidth}px solid ${theme.vars.palette.error.main}`,
    color: theme.vars.palette.error.main,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: `rgba(${theme.vars.palette.error.mainChannel} / ${interactionOpacities.tint})`,
      },
    },
  }),
  inverse: theme => ({
    backgroundColor: theme.vars.palette.surface.ink,
    color: theme.vars.palette.surface.page,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: `rgba(${theme.vars.palette.text.primaryChannel} / ${interactionOpacities.solid})`,
      },
    },
  }),
};

function disabledStyle(theme: Theme): CSSObject {
  return {
    backgroundColor: theme.vars.palette.surface.field,
    color: theme.vars.palette.surface.muted,
    border: 'none',
    boxShadow: 'none',
  };
}

const Root = styled(ButtonBase, {
  shouldForwardProp: prop =>
    prop !== 'buttonVariant' && prop !== 'buttonSize' && prop !== 'isFullWidth' && prop !== 'isLoading',
})<RootProps>(({ theme, buttonVariant, buttonSize, isFullWidth, isLoading }) => {
  const size = controlSizes[buttonSize];

  return {
    ...typographyTokens.button,
    minHeight: size.height,
    paddingInline: size.paddingInline,
    borderRadius: size.radius,
    fontSize: pxToRem(size.fontSize),
    width: isFullWidth ? '100%' : 'auto',
    transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow', 'color']),
    ...variantStyles[buttonVariant](theme),
    '&.Mui-focusVisible': {
      outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
      outlineOffset: focusRing.offset,
    },
    ...(isLoading ? {} : { '&.Mui-disabled': disabledStyle(theme) }),
  };
});

const Content = styled('span', {
  shouldForwardProp: prop => prop !== 'isLoading',
})<ContentProps>(({ isLoading }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: controlGap,
  opacity: isLoading ? 0 : 1,
}));

const LoadingOverlay = styled('span')({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    startIcon,
    endIcon,
    children,
    id,
    ...rest
  } = props;

  const generatedId = React.useId();
  const isLoading = loading && !disabled;
  const labelId = id ?? generatedId;
  const { iconSize } = controlSizes[size];

  return (
    <Root
      ref={ref}
      {...rest}
      id={isLoading ? labelId : id}
      buttonVariant={variant}
      buttonSize={size}
      isFullWidth={fullWidth}
      isLoading={isLoading}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      <Content isLoading={isLoading}>
        {startIcon && <Icon name={startIcon} size={iconSize} />}
        {children}
        {endIcon && <Icon name={endIcon} size={iconSize} />}
      </Content>
      {isLoading && (
        <LoadingOverlay>
          <CircularProgress aria-labelledby={labelId} color="inherit" size={iconSize} />
        </LoadingOverlay>
      )}
    </Root>
  );
}) as ExtendButtonBase<ButtonTypeMap>;

export default Button;
