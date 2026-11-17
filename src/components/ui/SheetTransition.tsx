'use client';

import React from 'react';
import { sheetMetrics } from '@/theme';
import OverlayTransition, { OverlayMotionProfile, OverlayTransitionProps } from './OverlayTransition';

const sheetProfile: OverlayMotionProfile = {
  from: { transform: `translateY(${sheetMetrics.enterOffset}px)`, opacity: sheetMetrics.enterOpacity },
  to: { transform: 'none', opacity: 1 },
  away: { transform: `translateY(${sheetMetrics.exitTranslate})`, opacity: 1 },
  enterDurationMs: sheetMetrics.enterDurationMs,
  exitDurationMs: sheetMetrics.exitDurationMs,
};

const SheetTransition = React.forwardRef<HTMLDivElement, OverlayTransitionProps>(function SheetTransition(props, ref) {
  return <OverlayTransition {...props} ref={ref} profile={sheetProfile} />;
});

export default SheetTransition;
