'use client';

import React from 'react';
import Modal from '@mui/material/Modal';
import { styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import PanelTransition from '@/components/ui/PanelTransition';
import { SheetBackdrop } from '@/components/ui/Sheet';
import { REDUCED_MOTION_QUERY } from '@/helpers/reduced-motion';
import { dialogMetrics } from '@/theme';
import { personNameMetrics } from './person-name-metrics';

export interface PersonNamePanelProps {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  titleId: string;
  children: React.ReactNode;
}

/**
 * O `(pointer: coarse)` separa o tablet deitado do desktop sem criar um corte de largura novo: o teclado
 * do tablet cobre perto de 40% da altura, então o painel nasce no topo; com mouse, centrado.
 */
const Root = styled(Modal)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '@media (pointer: coarse)': {
    alignItems: 'flex-start',
    paddingBlockStart: dialogMetrics.gutter,
  },
});

// A RF-14 se cumpre pela âncora no topo e pela altura natural do painel (nome, erro e CTA cabem acima do
// teclado), não por `dvh`: o teclado não encolhe `dvh` por padrão. O `100%` é a mesma folga do `Overlay`.
const Panel = styled('div')(({ theme }) => ({
  boxSizing: 'border-box',
  inlineSize: personNameMetrics.panelInlineSize,
  maxInlineSize: `calc(100% - ${dialogMetrics.gutter * 2}px)`,
  maxBlockSize: `calc(100% - ${dialogMetrics.gutter * 2}px)`,
  overflowY: 'auto',
  padding: personNameMetrics.panelPadding,
  borderRadius: dialogMetrics.radius,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: dialogMetrics.shadow,
  outline: 'none',
}));

const PersonNamePanel: React.FC<PersonNamePanelProps> = ({ open, onClose, onExited, titleId, children }) => {
  const isReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  return (
    <Root
      open={open}
      onClose={onClose}
      closeAfterTransition
      onTransitionExited={onExited}
      slots={{ backdrop: SheetBackdrop }}
      slotProps={{
        backdrop: {
          transitionDuration: isReducedMotion
            ? 0
            : { enter: dialogMetrics.enterDurationMs, exit: dialogMetrics.exitDurationMs },
        },
      }}
    >
      <PanelTransition in={open} reducedMotion={isReducedMotion}>
        <Panel role="dialog" aria-modal="true" aria-labelledby={titleId}>
          {children}
        </Panel>
      </PanelTransition>
    </Root>
  );
};

export default PersonNamePanel;
