'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { controlSizes, focusRing, HOVER_MEDIA_QUERY, optionGroupMetrics } from '@/theme';

export interface OptionGroupAddButtonProps {
  label: string;
  isDisabled: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const Root = styled(ButtonBase)(({ theme }) => ({
  width: controlSizes.md.height,
  height: controlSizes.md.height,
  flexShrink: 0,
  borderRadius: optionGroupMetrics.addButtonRadius,
  backgroundColor: theme.vars.palette.surface.field,
  color: theme.vars.palette.primary.main,
  transition: theme.transitions.create(['background-color', 'color']),
  [HOVER_MEDIA_QUERY]: {
    '&:hover': {
      backgroundColor: theme.vars.palette.surface.line,
    },
  },
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  '&.Mui-disabled': {
    color: theme.vars.palette.surface.muted,
  },
}));

const OptionGroupAddButton = React.forwardRef<HTMLButtonElement, OptionGroupAddButtonProps>(
  function OptionGroupAddButton({ label, isDisabled, onClick }, ref) {
    return (
      <Root ref={ref} aria-label={label} disabled={isDisabled} onClick={onClick}>
        <Icon name="add" size={optionGroupMetrics.addButtonIconSize} />
      </Root>
    );
  }
);

export default OptionGroupAddButton;
