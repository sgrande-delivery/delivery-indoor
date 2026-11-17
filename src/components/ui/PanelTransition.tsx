'use client';

import React from 'react';
import { dialogMetrics } from '@/theme';
import OverlayTransition, { OverlayMotionProfile, OverlayTransitionProps } from './OverlayTransition';

const panelProfile: OverlayMotionProfile = {
  from: { transform: `translateY(${dialogMetrics.enterOffset}px)`, opacity: 0 },
  to: { transform: 'none', opacity: 1 },
  away: { transform: `translateY(${dialogMetrics.enterOffset}px)`, opacity: 0 },
  enterDurationMs: dialogMetrics.enterDurationMs,
  exitDurationMs: dialogMetrics.exitDurationMs,
};

const PanelTransition = React.forwardRef<HTMLDivElement, OverlayTransitionProps>(function PanelTransition(props, ref) {
  return <OverlayTransition {...props} ref={ref} profile={panelProfile} />;
});

export default PanelTransition;
