'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { chipMetrics, pxToRem } from '@/theme';
import { ChipIconTone, chipCounterBackground, chipIconColor } from './chip-skin';
import Icon from './Icon';
import { IconName } from './icon-names';

export interface ChipContentProps {
  label: string;
  icon?: IconName;
  iconTone?: ChipIconTone;
  count?: number;
  badge?: number;
  strikethrough?: boolean;
  isFilled: boolean;
}

interface GlyphProps {
  iconTone: ChipIconTone;
}

interface LabelProps {
  isStruck: boolean;
}

interface FilledProps {
  isFilled: boolean;
}

/**
 * O riscado vive no rótulo, e o glifo fica de fora dele — a chip de exclusão do sheet risca o nome
 * do ingrediente e **não** o ícone. O `textDecoration: 'none'` aqui é o mesmo que o desenho escreve:
 * o glifo se protege sozinho, mesmo se um ancestral riscar.
 */
const Glyph = styled(Icon, {
  shouldForwardProp: prop => prop !== 'iconTone',
})<GlyphProps>(({ theme, iconTone }) => ({
  color: chipIconColor(theme, iconTone),
  textDecoration: 'none',
}));

const Label = styled('span', {
  shouldForwardProp: prop => prop !== 'isStruck',
})<LabelProps>(({ isStruck }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: chipMetrics.countGap,
  textDecoration: isStruck ? 'line-through' : 'none',
}));

const Count = styled('span', {
  shouldForwardProp: prop => prop !== 'isFilled',
})<FilledProps>(({ theme, isFilled }) => ({
  opacity: isFilled ? chipMetrics.countOpacity : 1,
  color: isFilled ? 'inherit' : theme.vars.palette.surface.muted,
}));

const Counter = styled('span', {
  shouldForwardProp: prop => prop !== 'isFilled',
})<FilledProps>(({ theme, isFilled }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minInlineSize: chipMetrics.counterMinInlineSize,
  blockSize: chipMetrics.counterBlockSize,
  paddingInline: chipMetrics.counterPaddingInline,
  borderRadius: chipMetrics.radius,
  backgroundColor: chipCounterBackground(theme, isFilled),
  fontSize: pxToRem(chipMetrics.counterFontSize),
  fontWeight: chipMetrics.counterFontWeight,
}));

/**
 * Os quatro slots que o desenho põe dentro da chip, na ordem em que ele os põe: glifo com cor
 * própria, rótulo, sufixo de contagem e pastilha de contador. O `close` das chips removíveis **não**
 * está aqui — ele é ação, e ação dentro de um controle que já é botão exige outro molde
 * (`RemovableChip`).
 */
const ChipContent: React.FC<ChipContentProps> = ({
  label,
  icon,
  iconTone = 'inherit',
  count,
  badge,
  strikethrough = false,
  isFilled,
}) => {
  return (
    <React.Fragment>
      {icon && <Glyph name={icon} size={chipMetrics.iconSize} iconTone={iconTone} />}
      <Label isStruck={strikethrough}>
        {label}
        {count !== undefined && <Count isFilled={isFilled}>{count}</Count>}
      </Label>
      {badge !== undefined && <Counter isFilled={isFilled}>{badge}</Counter>}
    </React.Fragment>
  );
};

export default ChipContent;
