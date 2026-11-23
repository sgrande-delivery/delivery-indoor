'use client';

import { useEffect, useState } from 'react';

export const THROW_FLAG = 'sandbox-states-throw';

/** Lança no render enquanto o sinalizador da aba estiver ligado, para exercitar o `app/error.tsx`. */
export default function ThrowOnDemand(): null {
  const [shouldThrow, setShouldThrow] = useState(false);

  useEffect(() => {
    setShouldThrow(sessionStorage.getItem(THROW_FLAG) !== null);
  }, []);

  if (shouldThrow) {
    throw new Error('sandbox: erro de render provocado');
  }

  return null;
}
