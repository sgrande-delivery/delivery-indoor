'use client';

import { styled } from '@mui/material';
import React from 'react';
import { materialSymbolsRounded } from '@/fonts';
import { IconName } from './icon-names';

const OPTICAL_SIZE_MIN = 20;
const OPTICAL_SIZE_MAX = 48;

type GlyphProps = {
  filled: boolean;
  glyphSize: number;
};

const Glyph = styled('span', {
  shouldForwardProp: prop => prop !== 'filled' && prop !== 'glyphSize',
})<GlyphProps>(({ filled, glyphSize }) => ({
  fontFamily: materialSymbolsRounded.style.fontFamily,
  fontWeight: 'normal',
  fontStyle: 'normal',
  fontSize: glyphSize,
  lineHeight: 1,
  letterSpacing: 'normal',
  textTransform: 'none',
  display: 'inline-block',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  wordWrap: 'normal',
  direction: 'ltr',
  userSelect: 'none',
  WebkitFontSmoothing: 'antialiased',
  fontVariationSettings: [
    `'FILL' ${filled ? 1 : 0}`,
    `'wght' 400`,
    `'GRAD' 0`,
    `'opsz' ${Math.min(Math.max(glyphSize, OPTICAL_SIZE_MIN), OPTICAL_SIZE_MAX)}`,
  ].join(', '),
}));

export type { IconName } from './icon-names';

export interface IconProps {
  name: IconName;
  fill?: boolean;
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, fill = false, size = 24, className }) => {
  return (
    <Glyph className={className} filled={fill} glyphSize={size} aria-hidden translate="no">
      {name}
    </Glyph>
  );
};

export default Icon;
