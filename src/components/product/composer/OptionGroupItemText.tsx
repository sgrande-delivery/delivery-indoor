'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { formatCents } from '@/helpers/money';
import { fontFamilies, optionGroupMetrics, productSectionMetrics, pxToRem } from '@/theme';
import { OptionGroupItem } from '@/types/product-detail';

const INCREMENT_PREFIX = '+ ';

export interface OptionGroupItemTextProps {
  item: OptionGroupItem;
  increment: number | null;
  isSelected: boolean;
  isDisabled: boolean;
}

interface NameProps {
  isDisabled: boolean;
}

interface IncrementProps {
  isSelected: boolean;
}

const Name = styled('span', {
  shouldForwardProp: prop => prop !== 'isDisabled',
})<NameProps>(({ theme, isDisabled }) => ({
  display: 'block',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productSectionMetrics.labelFontSize),
  lineHeight: productSectionMetrics.labelLineHeight,
  color: isDisabled ? theme.vars.palette.surface.muted : theme.vars.palette.surface.ink,
}));

const Increment = styled('span', {
  shouldForwardProp: prop => prop !== 'isSelected',
})<IncrementProps>(({ theme, isSelected }) => ({
  display: 'block',
  marginBlockStart: optionGroupMetrics.incrementMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(optionGroupMetrics.incrementFontSize),
  fontWeight: optionGroupMetrics.incrementFontWeight,
  color: isSelected ? theme.vars.palette.brand.text : theme.vars.palette.surface.muted,
}));

const OptionGroupItemText: React.FC<OptionGroupItemTextProps> = ({ item, increment, isSelected, isDisabled }) => {
  return (
    <>
      <Name isDisabled={isDisabled}>{item.name}</Name>
      {increment !== null && increment > 0 && (
        <Increment isSelected={isSelected}>{`${INCREMENT_PREFIX}${formatCents(increment)}`}</Increment>
      )}
    </>
  );
};

export default OptionGroupItemText;
