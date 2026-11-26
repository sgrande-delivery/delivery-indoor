'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { fontFamilies, pxToRem, radii } from '@/theme';
import type { BoardRoundStatus } from '@/types/board-bill';
import {
  BOARD_ROUND_STATUS_LABEL,
  BOARD_ROUND_STATUS_TONE,
  roundStatusPillMetrics,
  RoundStatusTone,
} from './round-status';

export interface RoundStatusPillProps {
  status: BoardRoundStatus;
}

interface RootProps {
  tone: RoundStatusTone;
}

const Root = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<RootProps>(({ theme, tone }) => {
  const colors =
    tone === 'neutral'
      ? { background: theme.vars.palette.surface.field, color: theme.vars.palette.surface.muted }
      : {
          background: theme.vars.palette.toneOnCard.badge[tone].background,
          color: theme.vars.palette.toneOnCard.badge[tone].text,
        };

  return {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    paddingBlock: roundStatusPillMetrics.pillPaddingBlock,
    paddingInline: roundStatusPillMetrics.pillPaddingInline,
    borderRadius: radii.pill,
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(roundStatusPillMetrics.pillFontSize),
    fontWeight: roundStatusPillMetrics.pillWeight,
    letterSpacing: roundStatusPillMetrics.pillLetterSpacing,
    lineHeight: 1,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    backgroundColor: colors.background,
    color: colors.color,
  };
});

/**
 * O estado da rodada, uma vez por grupo. O tom é o selo suave do tema (`toneOnCard.badge`) e nunca a cor do tenant;
 * a caixa alta é CSS, o texto-fonte é minúsculo. Quem carrega o significado é o texto, a cor é reforço.
 */
const RoundStatusPill: React.FC<RoundStatusPillProps> = ({ status }) => {
  return <Root tone={BOARD_ROUND_STATUS_TONE[status]}>{BOARD_ROUND_STATUS_LABEL[status]}</Root>;
};

export default RoundStatusPill;
