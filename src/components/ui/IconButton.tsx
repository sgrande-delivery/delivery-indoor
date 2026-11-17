'use client';

import React from 'react';
import ButtonBase, { ExtendButtonBase, ExtendButtonBaseTypeMap } from '@mui/material/ButtonBase';
import { OverrideProps } from '@mui/material/OverridableComponent';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import {
  focusRing,
  HOVER_MEDIA_QUERY,
  iconButtonMetrics,
  iconButtonSizes,
  IconButtonSizeName,
  interactionOpacities,
} from '@/theme';
import Icon from './Icon';
import { IconName } from './icon-names';

export type IconButtonVariant = 'solid' | 'ink' | 'neutral';

export type IconButtonSize = IconButtonSizeName;

export interface IconButtonOwnProps {
  'aria-label': string;
  icon: IconName;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  fill?: boolean;
  children?: never;
}

export interface IconButtonTypeMap<RootComponent extends React.ElementType = 'button'> {
  props: IconButtonOwnProps;
  defaultComponent: RootComponent;
}

export type IconButtonProps<RootComponent extends React.ElementType = 'button'> = OverrideProps<
  ExtendButtonBaseTypeMap<IconButtonTypeMap<RootComponent>>,
  RootComponent
>;

interface RootProps {
  buttonVariant: IconButtonVariant;
  buttonSize: IconButtonSize;
}

const variantStyles: Record<IconButtonVariant, (theme: Theme) => CSSObject> = {
  solid: theme => ({
    borderRadius: iconButtonMetrics.circleRadius,
    backgroundColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.primary.contrastText,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: theme.vars.palette.primary.dark,
      },
    },
  }),
  ink: theme => ({
    borderRadius: iconButtonMetrics.squareRadius,
    backgroundColor: theme.vars.palette.surface.ink,
    color: theme.vars.palette.surface.page,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: `rgba(${theme.vars.palette.text.primaryChannel} / ${interactionOpacities.solid})`,
      },
    },
  }),
  neutral: theme => ({
    borderRadius: iconButtonMetrics.circleRadius,
    backgroundColor: theme.vars.palette.surface.field,
    color: theme.vars.palette.surface.ink,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: theme.vars.palette.surface.line,
      },
    },
  }),
};

const Root = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'buttonVariant' && prop !== 'buttonSize',
})<RootProps>(({ theme, buttonVariant, buttonSize }) => ({
  width: iconButtonSizes[buttonSize].size,
  height: iconButtonSizes[buttonSize].size,
  flexShrink: 0,
  transition: theme.transitions.create(['background-color', 'color']),
  ...variantStyles[buttonVariant](theme),
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  '&.Mui-disabled': {
    backgroundColor: theme.vars.palette.surface.field,
    color: theme.vars.palette.surface.muted,
  },
}));

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
  const { icon, variant = 'solid', size = 'md', fill = false, ...rest } = props;

  return (
    <Root ref={ref} {...rest} buttonVariant={variant} buttonSize={size}>
      <Icon name={icon} fill={fill} size={iconButtonSizes[size].iconSize} />
    </Root>
  );
}) as ExtendButtonBase<IconButtonTypeMap>;

export default IconButton;
