'use client';

import { useEffect, useState } from 'react';
import { resolveErrorCode } from '@/services/http-error-code';
import { createErrorReference } from './error-reference';

export type ErrorReportSource = 'next-error-boundary' | 'global-error' | 'route-query';

export type ReportedError = Error & { digest?: string };

interface ErrorReport {
  error: unknown;
  reference: string;
}

function describeError(error: unknown): { message: string; stack: string | undefined; digest: string | undefined } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack, digest: (error as ReportedError).digest };
  }

  return { message: String(error), stack: undefined, digest: undefined };
}

/**
 * A referência só sai depois que o `/api/log` responde 200. O código (`resolveErrorCode`) não depende dele e a
 * tela o mostra desde o primeiro paint (RF-11).
 */
export function useErrorReport(error: unknown, source: ErrorReportSource): string | null {
  const [report, setReport] = useState<ErrorReport | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const reference = createErrorReference();

    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        code: resolveErrorCode(error),
        ...describeError(error),
        reference,
        url: window.location.origin + window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    })
      .then(response => {
        if (response.ok && isCurrent) {
          setReport({ error, reference });
        }
      })
      .catch(() => undefined);

    return () => {
      isCurrent = false;
    };
  }, [error, source]);

  if (report === null || report.error !== error) {
    return null;
  }

  return report.reference;
}
