'use client';

import React from 'react';
import { InputBaseProps } from '@mui/material/InputBase';
import { OverridableComponent, OverrideProps } from '@mui/material/OverridableComponent';
import FieldShell, { ERROR_ICON, FieldControl, FieldIcon, FieldOwnProps } from './Field';

type ForwardedInputBaseProps = Omit<
  InputBaseProps,
  | 'className'
  | 'endAdornment'
  | 'fullWidth'
  | 'inputComponent'
  | 'renderSuffix'
  | 'slotProps'
  | 'slots'
  | 'startAdornment'
  | 'sx'
>;

export interface InputOwnProps extends FieldOwnProps, ForwardedInputBaseProps {}

export interface InputTypeMap<RootComponent extends React.ElementType = 'div'> {
  props: InputOwnProps;
  defaultComponent: RootComponent;
}

export type InputProps<RootComponent extends React.ElementType = 'div'> = OverrideProps<
  InputTypeMap<RootComponent>,
  RootComponent
>;

type InputRenderProps = Omit<InputProps, 'ref'> & { component?: React.ElementType };

const Input = React.forwardRef<HTMLDivElement, InputRenderProps>(function Input(props, ref) {
  const {
    label,
    helperText,
    startIcon,
    endIcon,
    endSlot,
    error = false,
    className,
    style,
    component,
    id,
    'aria-describedby': ariaDescribedBy,
    ...rest
  } = props;

  const generatedId = React.useId();
  const controlId = id ?? `${generatedId}-input`;
  const helperId = helperText ? `${generatedId}-helper` : undefined;
  const describedBy = [helperId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;
  const resolvedEndIcon = error ? ERROR_ICON : endIcon;

  return (
    <FieldShell
      ref={ref}
      rootComponent={component}
      className={className}
      style={style}
      controlId={controlId}
      helperId={helperId}
      label={label}
      helperText={helperText}
      hasError={error}
    >
      <FieldControl
        {...rest}
        id={controlId}
        error={error}
        aria-describedby={describedBy}
        startAdornment={startIcon ? <FieldIcon name={startIcon} placement="start" hasError={error} /> : undefined}
        endAdornment={resolvedEndIcon ? <FieldIcon name={resolvedEndIcon} placement="end" hasError={error} /> : endSlot}
      />
    </FieldShell>
  );
}) as OverridableComponent<InputTypeMap>;

export default Input;
