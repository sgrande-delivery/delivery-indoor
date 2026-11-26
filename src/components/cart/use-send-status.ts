'use client';

import { useSyncExternalStore } from 'react';
import { getSendState, subscribeToSend } from './send-store';

export interface SendStatus {
  isSending: boolean;
  /** Há tentativa a reenviar: o pedido pode ter entrado e a sacola já não existir. */
  isRetryable: boolean;
}

/** O envio visto de fora do `useSendOrder`: quem só precisa saber se há envio em voo ou a recuperar. */
export function useSendStatus(): SendStatus {
  const state = useSyncExternalStore(subscribeToSend, getSendState, getSendState);

  return { isSending: state.isSending, isRetryable: state.attempt !== null && state.error !== null };
}
