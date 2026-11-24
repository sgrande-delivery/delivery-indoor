'use client';

import { useState } from 'react';

export interface OverlayPresence<T> {
  value: T | null;
  open: boolean;
  onExited: () => void;
}

export function useOverlayPresence<T>(value: T | null): OverlayPresence<T> {
  const [retained, setRetained] = useState<T | null>(value);

  if (value !== null && value !== retained) {
    setRetained(value);
  }

  function handleExited(): void {
    setRetained(value);
  }

  return {
    value: value ?? retained,
    open: value !== null,
    onExited: handleExited,
  };
}
