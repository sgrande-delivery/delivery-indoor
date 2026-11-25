'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { controlSizes, focusRing, fontFamilies, fontWeights, interactionOpacities, pxToRem } from '@/theme';
import { orderingAsMetrics } from './ordering-as-metrics';

const CHANGE_LABEL = 'trocar';
const CHANGE_ARIA_LABEL = 'Trocar o nome de quem está pedindo';

export interface OrderingAsRowProps {
  name: string;
  onChange: () => void;
  disabled?: boolean;
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minInlineSize: 0,
  columnGap: orderingAsMetrics.gap,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(orderingAsMetrics.fontSize),
  color: theme.vars.palette.surface.muted,
}));

const Label = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  minInlineSize: 0,
  columnGap: orderingAsMetrics.gap,
});

const Name = styled('b')(({ theme }) => ({
  minInlineSize: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontWeight: fontWeights.bold,
  color: theme.vars.palette.surface.ink,
}));

const Prefix = styled('span')({
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

const Change = styled(ButtonBase)(({ theme }) => ({
  columnGap: 4,
  flexShrink: 0,
  minBlockSize: controlSizes.md.height,
  minInlineSize: controlSizes.md.height,
  paddingInline: orderingAsMetrics.gap,
  // o padding só alarga o alvo; a margem negativa devolve o respiro do artboard entre o nome e o "·"
  marginInlineStart: -orderingAsMetrics.gap,
  font: 'inherit',
  fontWeight: fontWeights.bold,
  color: theme.vars.palette.brand.text,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  '&.Mui-disabled': {
    opacity: interactionOpacities.disabled,
  },
}));

const OrderingAsRow: React.FC<OrderingAsRowProps> = ({ name, onChange, disabled = false }) => {
  return (
    <Root>
      <Label>
        <Icon name="person" size={orderingAsMetrics.iconSize} />
        <Prefix>Pedindo como </Prefix>
        <Name>{name}</Name>
      </Label>
      <Change disabled={disabled} aria-label={CHANGE_ARIA_LABEL} onClick={onChange}>
        <span aria-hidden="true">·</span>
        {CHANGE_LABEL}
      </Change>
    </Root>
  );
};

export default OrderingAsRow;
