import React from 'react';
import { ExtendButtonBaseTypeMap } from '@mui/material/ButtonBase';
import { OverrideProps } from '@mui/material/OverridableComponent';
import { ButtonOwnProps } from '@/components/ui';

export interface ErrorPageActionTypeMap<
  OmittedProps extends keyof ButtonOwnProps,
  RootComponent extends React.ElementType = 'button',
> {
  props: Omit<ButtonOwnProps, OmittedProps>;
  defaultComponent: RootComponent;
}

export type ErrorPageActionProps<OmittedProps extends keyof ButtonOwnProps> = OverrideProps<
  ExtendButtonBaseTypeMap<ErrorPageActionTypeMap<OmittedProps>>,
  'button'
>;
