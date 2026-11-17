'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import {
  focusRing,
  fontFamilies,
  HOVER_MEDIA_QUERY,
  pxToRem,
  stepperMetrics,
  stepperSizes,
  StepperSizeName,
} from '@/theme';
import Icon from './Icon';

const DECREASE_LABEL = 'Diminuir quantidade';
const INCREASE_LABEL = 'Aumentar quantidade';
const STEP = 1;

type StepTone = 'brand' | 'neutral';

export interface QuantityStepperProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: StepperSizeName;
  decreaseLabel?: string;
  increaseLabel?: string;
}

interface SizedProps {
  sizeName: StepperSizeName;
}

interface StepButtonProps extends SizedProps {
  tone: StepTone;
}

interface ValueProps extends SizedProps {
  isDisabled: boolean;
}

const toneStyles: Record<StepTone, (theme: Theme) => CSSObject> = {
  neutral: theme => ({
    backgroundColor: theme.vars.palette.surface.card,
    color: theme.vars.palette.surface.ink,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: theme.vars.palette.surface.line,
      },
    },
  }),
  brand: theme => ({
    backgroundColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.primary.contrastText,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: theme.vars.palette.primary.dark,
      },
    },
  }),
};

const Root = styled('div', {
  shouldForwardProp: prop => prop !== 'sizeName',
})<SizedProps>(({ theme, sizeName }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: stepperSizes[sizeName].gap,
  height: stepperSizes[sizeName].height,
  paddingInline: stepperSizes[sizeName].paddingInline,
  borderRadius: stepperSizes[sizeName].radius,
  backgroundColor: theme.vars.palette.surface.field,
}));

const StepButton = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'tone' && prop !== 'sizeName',
})<StepButtonProps>(({ theme, tone, sizeName }) => ({
  width: stepperSizes[sizeName].buttonSize,
  height: stepperSizes[sizeName].buttonSize,
  flexShrink: 0,
  borderRadius: stepperSizes[sizeName].buttonRadius,
  transition: theme.transitions.create(['background-color', 'color']),
  ...toneStyles[tone](theme),
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  '&.Mui-disabled': {
    backgroundColor: theme.vars.palette.surface.field,
    color: theme.vars.palette.surface.muted,
  },
}));

const Value = styled('span', {
  shouldForwardProp: prop => prop !== 'isDisabled' && prop !== 'sizeName',
})<ValueProps>(({ theme, isDisabled, sizeName }) => ({
  width: stepperSizes[sizeName].valueWidth,
  flexShrink: 0,
  textAlign: 'center',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(stepperSizes[sizeName].valueFontSize),
  fontWeight: stepperMetrics.valueFontWeight,
  color: isDisabled ? theme.vars.palette.surface.muted : theme.vars.palette.surface.ink,
}));

const QuantityStepper = React.forwardRef<HTMLDivElement, QuantityStepperProps>(function QuantityStepper(props, ref) {
  const {
    value,
    onChange,
    min = 1,
    max,
    disabled = false,
    size = 'md',
    decreaseLabel = DECREASE_LABEL,
    increaseLabel = INCREASE_LABEL,
    ...rest
  } = props;

  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && (max === undefined || value < max);

  function handleDecrease() {
    onChange(Math.max(min, value - STEP));
  }

  function handleIncrease() {
    onChange(max === undefined ? value + STEP : Math.min(max, value + STEP));
  }

  return (
    <Root ref={ref} role="group" sizeName={size} {...rest}>
      <StepButton
        tone="neutral"
        sizeName={size}
        aria-label={decreaseLabel}
        disabled={!canDecrease}
        onClick={handleDecrease}
      >
        <Icon name="remove" size={stepperSizes[size].buttonIconSize} />
      </StepButton>
      <Value isDisabled={disabled} sizeName={size} aria-live="polite">
        {value}
      </Value>
      <StepButton
        tone="brand"
        sizeName={size}
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={handleIncrease}
      >
        <Icon name="add" size={stepperSizes[size].buttonIconSize} />
      </StepButton>
    </Root>
  );
});

export default QuantityStepper;
