'use client';

import React from 'react';
import { InputBaseComponentProps, inputBaseClasses, InputBaseProps } from '@mui/material/InputBase';
import { OverridableComponent, OverrideProps } from '@mui/material/OverridableComponent';
import { styled } from '@mui/material/styles';
import { inputMetrics, selectMetrics } from '@/theme';
import FieldShell, { FieldControl, FieldIcon, FieldOwnProps } from './Field';
import Icon from './Icon';

type ForwardedInputBaseProps = Omit<
  InputBaseProps,
  | 'className'
  | 'endAdornment'
  | 'fullWidth'
  | 'inputComponent'
  | 'maxRows'
  | 'minRows'
  | 'multiline'
  | 'renderSuffix'
  | 'rows'
  | 'slotProps'
  | 'slots'
  | 'startAdornment'
  | 'sx'
  | 'type'
>;

// `endIcon` e `endSlot` ficam de fora: o adorno final deste campo é sempre o chevron, e as duas props
// entrariam no `...rest` sem consumidor — o `InputBase` as espalharia na raiz e o React reclamaria do
// atributo desconhecido no `div`. O tipo diz o que o componente faz.
export interface SelectOwnProps extends Omit<FieldOwnProps, 'endIcon' | 'endSlot'>, ForwardedInputBaseProps {
  children?: React.ReactNode;
}

export interface SelectTypeMap<RootComponent extends React.ElementType = 'div'> {
  props: SelectOwnProps;
  defaultComponent: RootComponent;
}

export type SelectProps<RootComponent extends React.ElementType = 'div'> = OverrideProps<
  SelectTypeMap<RootComponent>,
  RootComponent
>;

type SelectRenderProps = Omit<SelectProps, 'ref'> & { component?: React.ElementType };

const NativeSelectInput = React.forwardRef<HTMLSelectElement, InputBaseComponentProps>(
  function NativeSelectInput(props, ref) {
    return <select ref={ref} {...props} />;
  }
);

const SelectControl = styled(FieldControl)({
  position: 'relative',
  [`& .${inputBaseClasses.input}`]: {
    appearance: 'none',
    cursor: 'pointer',
    paddingRight: selectMetrics.chevronSize + selectMetrics.chevronGap,
    [`&.${inputBaseClasses.disabled}`]: {
      cursor: 'default',
    },
  },
});

const Chevron = styled('span')(({ theme }) => ({
  position: 'absolute',
  right: inputMetrics.paddingInline,
  display: 'inline-flex',
  alignItems: 'center',
  pointerEvents: 'none',
  color: theme.vars.palette.surface.muted,
}));

const Select = React.forwardRef<HTMLDivElement, SelectRenderProps>(function Select(props, ref) {
  const {
    label,
    helperText,
    startIcon,
    error = false,
    className,
    style,
    component,
    id,
    children,
    inputProps,
    'aria-describedby': ariaDescribedBy,
    ...rest
  } = props;

  const generatedId = React.useId();
  const controlId = id ?? `${generatedId}-select`;
  const helperId = helperText ? `${generatedId}-helper` : undefined;
  const describedBy = [helperId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

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
      <SelectControl
        {...rest}
        id={controlId}
        error={error}
        aria-describedby={describedBy}
        inputComponent={NativeSelectInput}
        inputProps={{ ...inputProps, type: undefined, children }}
        startAdornment={startIcon ? <FieldIcon name={startIcon} placement="start" hasError={error} /> : undefined}
        endAdornment={
          <Chevron>
            <Icon name="expand_more" size={selectMetrics.chevronSize} />
          </Chevron>
        }
      />
    </FieldShell>
  );
}) as OverridableComponent<SelectTypeMap>;

export default Select;
