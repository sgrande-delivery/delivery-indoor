import { BoardBillKey } from './board-socket-events';

export interface InvalidationBatcher {
  schedule: (keys: readonly BoardBillKey[]) => void;
  cancel: () => void;
}

/** Debounce de borda final: junta os grupos de vários eventos e chama `flush` uma vez, `delayMs` depois do último. */
export function createInvalidationBatcher(
  flush: (keys: ReadonlySet<BoardBillKey>) => void,
  delayMs: number
): InvalidationBatcher {
  let pending = new Set<BoardBillKey>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  function cancel(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    pending = new Set();
  }

  function schedule(keys: readonly BoardBillKey[]): void {
    for (const key of keys) {
      pending.add(key);
    }

    if (timer !== null) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      const batch = pending;

      timer = null;
      pending = new Set();
      flush(batch);
    }, delayMs);
  }

  return { schedule, cancel };
}
