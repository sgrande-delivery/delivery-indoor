'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { motion, sheetMetrics } from '@/theme';

export interface SheetDragAreaProps {
  onPointerDown: React.PointerEventHandler<HTMLElement>;
  onPointerMove: React.PointerEventHandler<HTMLElement>;
  onPointerUp: React.PointerEventHandler<HTMLElement>;
  onPointerCancel: React.PointerEventHandler<HTMLElement>;
  onClickCapture: React.MouseEventHandler<HTMLElement>;
}

export interface SheetMediaAreaProps {
  onTouchStart: React.TouchEventHandler<HTMLElement>;
  onTouchEnd: React.TouchEventHandler<HTMLElement>;
  onTouchCancel: React.TouchEventHandler<HTMLElement>;
  onClickCapture: React.MouseEventHandler<HTMLElement>;
}

export interface SheetDragController {
  areaProps: SheetDragAreaProps;
  mediaAreaRef: React.RefCallback<HTMLElement>;
  mediaAreaProps: SheetMediaAreaProps;
}

export interface SheetDragOptions {
  surfaceRef: React.RefObject<HTMLElement | null>;
  backdropRef: React.RefObject<HTMLElement | null>;
  bodyRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  reducedMotion: boolean;
  onDismiss: () => void;
}

interface DragSample {
  y: number;
  time: number;
}

type MediaPhase = 'idle' | 'undecided' | 'dragging' | 'scrolling';

interface MediaHandlers {
  move: (event: TouchEvent) => void;
  cancel: () => void;
}

interface DragState {
  tracking: boolean;
  active: boolean;
  captured: boolean;
  dirty: boolean;
  suppressClick: boolean;
  pointerId: number | null;
  startY: number;
  offset: number;
  surfaceHeight: number;
  samples: DragSample[];
  surface: HTMLElement | null;
  backdrop: HTMLElement | null;
  refusalTimer: number | null;
  settleCleanup: (() => void) | null;
  mediaPhase: MediaPhase;
  mediaTouchId: number | null;
  mediaStartY: number;
  mediaStartTime: number;
}

const surfaceSettleTransition = `transform ${sheetMetrics.dragSettleDurationMs}ms ${motion.easing.standard}`;
const backdropSettleTransition = `opacity ${sheetMetrics.dragSettleDurationMs}ms ${motion.easing.standard}`;

function createState(): DragState {
  return {
    tracking: false,
    active: false,
    captured: false,
    dirty: false,
    suppressClick: false,
    pointerId: null,
    startY: 0,
    offset: 0,
    surfaceHeight: 0,
    samples: [],
    surface: null,
    backdrop: null,
    refusalTimer: null,
    settleCleanup: null,
    mediaPhase: 'idle',
    mediaTouchId: null,
    mediaStartY: 0,
    mediaStartTime: 0,
  };
}

interface TouchPoint {
  identifier: number;
  clientY: number;
}

interface TouchPointList {
  readonly length: number;
  readonly [index: number]: TouchPoint;
}

function findTouch(list: TouchPointList, identifier: number | null): TouchPoint | null {
  if (identifier === null) {
    return null;
  }

  for (let index = 0; index < list.length; index += 1) {
    if (list[index].identifier === identifier) {
      return list[index];
    }
  }

  return null;
}

function readPendingOffset(surface: HTMLElement | null): number {
  if (surface === null) {
    return 0;
  }

  const transform = window.getComputedStyle(surface).transform;

  if (transform === '' || transform === 'none') {
    return 0;
  }

  return new DOMMatrixReadOnly(transform).m42;
}

function resolveOffset(delta: number): number {
  if (delta >= 0) {
    return delta;
  }

  return Math.max(delta / sheetMetrics.dragUpwardResistance, -sheetMetrics.dragUpwardMaxOffset);
}

function resolveBackdropOpacity(offset: number, surfaceHeight: number): number {
  if (offset <= 0 || surfaceHeight <= 0) {
    return 1;
  }

  return Math.max(0, 1 - offset / surfaceHeight);
}

function stopSettle(state: DragState): void {
  if (state.settleCleanup !== null) {
    state.settleCleanup();
    state.settleCleanup = null;
  }
}

function clearRefusalTimer(state: DragState): void {
  if (state.refusalTimer !== null) {
    window.clearTimeout(state.refusalTimer);
    state.refusalTimer = null;
  }
}

function releaseSurface(state: DragState, surface: HTMLElement | null): void {
  stopSettle(state);
  state.dirty = false;
  state.offset = 0;

  if (surface !== null) {
    surface.style.transition = '';
    surface.style.transform = '';
  }
}

function beginWrite(state: DragState): void {
  stopSettle(state);
  state.dirty = true;

  if (state.surface !== null) {
    state.surface.style.transition = 'none';
  }

  if (state.backdrop !== null) {
    state.backdrop.style.transition = 'none';
  }
}

function writeOffset(state: DragState, offset: number): void {
  state.offset = offset;

  if (state.surface !== null) {
    state.surface.style.transform = `translateY(${offset}px)`;
  }

  if (state.backdrop !== null) {
    state.backdrop.style.opacity = `${resolveBackdropOpacity(offset, state.surfaceHeight)}`;
  }
}

function pushSample(state: DragState, y: number, time: number): void {
  state.samples.push({ y, time });

  while (state.samples.length > 1 && time - state.samples[0].time > sheetMetrics.dragVelocityWindowMs) {
    state.samples.shift();
  }
}

function releaseVelocity(state: DragState, time: number): number {
  if (state.samples.length < 2) {
    return 0;
  }

  const last = state.samples[state.samples.length - 1];
  const first = state.samples[0];
  const elapsed = last.time - first.time;

  if (elapsed <= 0 || time - last.time > sheetMetrics.dragVelocityWindowMs) {
    return 0;
  }

  return (last.y - first.y) / elapsed;
}

function passedDismissThreshold(state: DragState, velocity: number): boolean {
  if (state.surfaceHeight > 0 && state.offset >= state.surfaceHeight * sheetMetrics.dragDismissRatio) {
    return true;
  }

  return velocity >= sheetMetrics.dragDismissVelocity;
}

function finishGesture(state: DragState): void {
  state.tracking = false;
  state.active = false;
  state.captured = false;
  state.suppressClick = false;
  state.pointerId = null;
  state.samples = [];
}

function resetMediaGesture(state: DragState): void {
  state.mediaPhase = 'idle';
  state.mediaTouchId = null;
}

export function useSheetDrag(options: SheetDragOptions): SheetDragController {
  const { surfaceRef, backdropRef, bodyRef, open, reducedMotion, onDismiss } = options;
  const stateRef = useRef<DragState>(createState());
  const latestRef = useRef({ open, reducedMotion, onDismiss });
  const mediaHandlersRef = useRef<MediaHandlers>({ move: () => undefined, cancel: () => undefined });
  const mediaCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    latestRef.current = { open, reducedMotion, onDismiss };
    mediaHandlersRef.current = { move: handleMediaTouchMove, cancel };
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const state = stateRef.current;
    finishGesture(state);
    resetMediaGesture(state);
    releaseSurface(state, surfaceRef.current);
  }, [open, surfaceRef]);

  useEffect(() => {
    const state = stateRef.current;

    return () => {
      clearRefusalTimer(state);
      stopSettle(state);
    };
  }, []);

  function syncNodes(state: DragState): void {
    state.surface = surfaceRef.current;
    state.backdrop = backdropRef.current;
  }

  function releaseDrag(): void {
    const state = stateRef.current;
    releaseSurface(state, state.surface);

    if (state.backdrop !== null && latestRef.current.open) {
      state.backdrop.style.transition = '';
      state.backdrop.style.opacity = '1';
    }
  }

  function settleBack(): void {
    const state = stateRef.current;
    syncNodes(state);

    if (!state.dirty) {
      return;
    }

    stopSettle(state);
    const pending = state.offset;
    const node = state.surface;
    const backdrop = state.backdrop;

    if (node === null || latestRef.current.reducedMotion || pending === 0) {
      releaseDrag();
      return;
    }

    state.offset = 0;
    node.style.transition = surfaceSettleTransition;
    node.style.transform = 'translateY(0px)';

    if (backdrop !== null) {
      backdrop.style.transition = backdropSettleTransition;
      backdrop.style.opacity = '1';
    }

    function handleTransitionEnd(event: TransitionEvent): void {
      if (event.target !== node || event.propertyName !== 'transform') {
        return;
      }

      releaseDrag();
    }

    node.addEventListener('transitionend', handleTransitionEnd);

    state.settleCleanup = () => {
      node.removeEventListener('transitionend', handleTransitionEnd);
    };
  }

  function dismiss(): void {
    const state = stateRef.current;
    clearRefusalTimer(state);

    state.refusalTimer = window.setTimeout(() => {
      state.refusalTimer = null;

      if (!latestRef.current.open || state.tracking) {
        return;
      }

      settleBack();
    }, sheetMetrics.exitDurationMs);

    latestRef.current.onDismiss();
  }

  function begin(clientY: number, time: number): void {
    const state = stateRef.current;
    syncNodes(state);

    if (!latestRef.current.open || state.tracking || state.surface === null) {
      return;
    }

    clearRefusalTimer(state);
    state.tracking = true;
    state.active = false;
    state.startY = clientY;
    state.surfaceHeight = state.surface.getBoundingClientRect().height;
    state.samples = [{ y: clientY, time }];
    state.suppressClick = false;
  }

  function move(clientY: number, time: number): boolean {
    const state = stateRef.current;
    syncNodes(state);

    if (!state.tracking || state.surface === null) {
      return false;
    }

    const delta = clientY - state.startY;

    if (!state.active) {
      if (Math.abs(delta) < sheetMetrics.dragStartThreshold) {
        return false;
      }

      state.active = true;
      const pending = state.dirty ? readPendingOffset(state.surface) : 0;
      beginWrite(state);

      if (pending !== 0) {
        state.startY = clientY - pending;
      }
    }

    pushSample(state, clientY, time);
    writeOffset(state, resolveOffset(clientY - state.startY));

    return true;
  }

  function end(): void {
    const state = stateRef.current;

    if (!state.tracking) {
      return;
    }

    const wasActive = state.active;
    const velocity = releaseVelocity(state, performance.now());
    finishGesture(state);

    if (!latestRef.current.open) {
      return;
    }

    if (wasActive && passedDismissThreshold(state, velocity)) {
      dismiss();
      return;
    }

    if (wasActive) {
      state.suppressClick = true;
    }

    settleBack();
  }

  function cancel(): void {
    const state = stateRef.current;

    if (!state.tracking) {
      return;
    }

    finishGesture(state);

    if (latestRef.current.open) {
      settleBack();
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>): void {
    const state = stateRef.current;
    state.suppressClick = false;

    if (event.button !== 0) {
      return;
    }

    if (state.tracking) {
      if (state.pointerId !== event.pointerId) {
        return;
      }

      cancel();
    }

    begin(event.clientY, event.timeStamp);

    if (state.tracking) {
      state.pointerId = event.pointerId;
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>): void {
    const state = stateRef.current;

    if (state.pointerId !== event.pointerId) {
      return;
    }

    if (event.buttons === 0) {
      cancel();
      return;
    }

    if (!move(event.clientY, event.timeStamp)) {
      return;
    }

    if (!state.captured) {
      state.captured = true;

      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>): void {
    if (stateRef.current.pointerId !== event.pointerId) {
      return;
    }

    end();
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLElement>): void {
    if (stateRef.current.pointerId !== event.pointerId) {
      return;
    }

    cancel();
  }

  function handleClickCapture(event: React.MouseEvent<HTMLElement>): void {
    if (!stateRef.current.suppressClick || event.detail === 0) {
      return;
    }

    stateRef.current.suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMediaTouchStart(event: React.TouchEvent<HTMLElement>): void {
    const state = stateRef.current;
    state.suppressClick = false;

    if (state.mediaPhase !== 'idle' || event.touches.length > 1) {
      return;
    }

    const touch = event.changedTouches[0];

    if (touch === undefined) {
      return;
    }

    state.mediaPhase = 'undecided';
    state.mediaTouchId = touch.identifier;
    state.mediaStartY = touch.clientY;
    state.mediaStartTime = event.timeStamp;
  }

  function handleMediaTouchMove(event: TouchEvent): void {
    const state = stateRef.current;

    if (state.mediaPhase === 'idle' || state.mediaPhase === 'scrolling') {
      return;
    }

    const touch = findTouch(event.touches, state.mediaTouchId);

    if (touch === null) {
      return;
    }

    if (state.mediaPhase === 'undecided') {
      const body = bodyRef.current;

      if (state.tracking || body === null || body.scrollTop > 0 || touch.clientY <= state.mediaStartY) {
        state.mediaPhase = 'scrolling';
        return;
      }

      state.mediaPhase = 'dragging';
      begin(state.mediaStartY, state.mediaStartTime);
    }

    event.preventDefault();
    move(touch.clientY, event.timeStamp);
  }

  function handleMediaTouchEnd(event: React.TouchEvent<HTMLElement>): void {
    const state = stateRef.current;

    if (findTouch(event.changedTouches, state.mediaTouchId) === null) {
      return;
    }

    const wasDragging = state.mediaPhase === 'dragging';
    resetMediaGesture(state);

    if (wasDragging) {
      end();
    }
  }

  function handleMediaTouchCancel(event: React.TouchEvent<HTMLElement>): void {
    const state = stateRef.current;

    if (findTouch(event.changedTouches, state.mediaTouchId) === null) {
      return;
    }

    const wasDragging = state.mediaPhase === 'dragging';
    resetMediaGesture(state);

    if (wasDragging) {
      cancel();
    }
  }

  const mediaAreaRef = useCallback((node: HTMLElement | null) => {
    const state = stateRef.current;
    const wasDragging = state.mediaPhase === 'dragging';
    resetMediaGesture(state);

    if (wasDragging) {
      mediaHandlersRef.current.cancel();
    }

    if (mediaCleanupRef.current !== null) {
      mediaCleanupRef.current();
      mediaCleanupRef.current = null;
    }

    if (node === null) {
      return;
    }

    function handleNativeTouchMove(event: TouchEvent): void {
      mediaHandlersRef.current.move(event);
    }

    node.addEventListener('touchmove', handleNativeTouchMove, { passive: false });

    mediaCleanupRef.current = () => {
      node.removeEventListener('touchmove', handleNativeTouchMove);
    };
  }, []);

  return {
    areaProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onClickCapture: handleClickCapture,
    },
    mediaAreaRef,
    mediaAreaProps: {
      onTouchStart: handleMediaTouchStart,
      onTouchEnd: handleMediaTouchEnd,
      onTouchCancel: handleMediaTouchCancel,
      onClickCapture: handleClickCapture,
    },
  };
}
