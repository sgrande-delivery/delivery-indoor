'use client';

import { ReactElement, startTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ErrorHomeAction from '@/components/error/ErrorHomeAction';
import RouteErrorState from '@/components/error/RouteErrorState';
import { recordRouteFailure } from '@/components/error/route-failure-streak';
import { SERVER_ERROR_DESCRIPTION, SERVER_ERROR_TITLE } from '@/components/error/server-error-copy';
import { ReportedError } from '@/components/error/use-error-report';

interface RouteErrorProps {
  error: ReportedError;
  reset: () => void;
}

export default function RouteError({ error, reset }: RouteErrorProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const failureStreak = recordRouteFailure(pathname, error);

  function handleRetry(): void {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <RouteErrorState
      error={error}
      failureStreak={failureStreak}
      onRetry={handleRetry}
      title={SERVER_ERROR_TITLE}
      description={SERVER_ERROR_DESCRIPTION}
      secondaryAction={<ErrorHomeAction tone="secondary" />}
      reportSource="next-error-boundary"
    />
  );
}
