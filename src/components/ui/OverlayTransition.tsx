'use client';

import React from 'react';
import { useForkRef } from '@mui/material/utils';
import Transition, { TransitionStatus } from 'react-transition-group/Transition';
import { motion } from '@/theme';

export interface OverlayMotionProfile {
  from: React.CSSProperties;
  to: React.CSSProperties;
  away: React.CSSProperties;
  enterDurationMs: number;
  exitDurationMs: number;
}

export interface OverlayTransitionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  in: boolean;
  reducedMotion: boolean;
  children: React.ReactElement<React.ComponentProps<'div'>>;
  onEnter?: () => void;
  onExited?: () => void;
}

interface OverlayTransitionOwnProps extends OverlayTransitionProps {
  profile: OverlayMotionProfile;
}

const reflow = (node: HTMLElement) => node.scrollTop;

function resolveTransition(durationMs: number, easing: string, reducedMotion: boolean): string {
  if (reducedMotion) {
    return 'none';
  }

  return `transform ${durationMs}ms ${easing}, opacity ${durationMs}ms ${easing}`;
}

function resolveStyle(
  status: TransitionStatus,
  isIn: boolean,
  profile: OverlayMotionProfile,
  reducedMotion: boolean
): React.CSSProperties {
  if (status === 'entering' || status === 'entered') {
    return {
      ...profile.to,
      transition: resolveTransition(profile.enterDurationMs, motion.easing.standard, reducedMotion),
    };
  }

  if (status === 'exiting') {
    return {
      ...profile.away,
      transition: resolveTransition(profile.exitDurationMs, motion.easing.accelerate, reducedMotion),
    };
  }

  return isIn ? profile.from : profile.away;
}

const OverlayTransition = React.forwardRef<HTMLDivElement, OverlayTransitionOwnProps>(
  function OverlayTransition(props, ref) {
    const { in: isIn, reducedMotion, profile, children, onEnter, onExited, ...other } = props;
    const nodeRef = React.useRef<HTMLDivElement>(null);
    const handleRef = useForkRef(nodeRef, ref);
    const timeout = reducedMotion
      ? 0
      : { appear: profile.enterDurationMs, enter: profile.enterDurationMs, exit: profile.exitDurationMs };

    function handleEnter(): void {
      const node = nodeRef.current;

      if (node !== null) {
        node.inert = false;

        if (!reducedMotion) {
          reflow(node);
        }
      }

      if (onEnter) {
        onEnter();
      }
    }

    function handleExit(): void {
      const node = nodeRef.current;

      if (node === null) {
        return;
      }

      node.inert = true;
      const active = document.activeElement;

      if (active instanceof HTMLElement && node.contains(active)) {
        active.blur();
      }
    }

    return (
      <Transition
        appear
        in={isIn}
        nodeRef={nodeRef}
        timeout={timeout}
        onEnter={handleEnter}
        onExit={handleExit}
        onExited={onExited}
      >
        {(status: TransitionStatus) =>
          React.cloneElement(children, {
            ...other,
            style: resolveStyle(status, isIn, profile, reducedMotion),
            ref: handleRef,
          })
        }
      </Transition>
    );
  }
);

export default OverlayTransition;
