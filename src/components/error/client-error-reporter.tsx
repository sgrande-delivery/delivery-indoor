'use client';

import { useEffect } from 'react';

type ClientErrorPayload = {
  source: 'window.error' | 'window.unhandledrejection';
  message: string;
  stack: string | null;
  filename?: string | null;
  lineno?: number | null;
  colno?: number | null;
  url: string;
  userAgent: string;
  timestamp: string;
};

function sendClientError(payload: ClientErrorPayload): void {
  try {
    void fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // nunca deixar o logger quebrar a app
  }
}

export default function ClientErrorReporter(): null {
  useEffect(() => {
    function handleError(event: ErrorEvent): void {
      sendClientError({
        source: 'window.error',
        message: event.message,
        stack: event.error instanceof Error ? (event.error.stack ?? null) : null,
        filename: event.filename ?? null,
        lineno: event.lineno ?? null,
        colno: event.colno ?? null,
        url: window.location.origin + window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent): void {
      const reason = event.reason;

      sendClientError({
        source: 'window.unhandledrejection',
        message:
          reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : JSON.stringify(reason),
        stack: reason instanceof Error ? (reason.stack ?? null) : null,
        url: window.location.origin + window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    }

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
