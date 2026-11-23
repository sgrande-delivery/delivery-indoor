'use client';

import React, { PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';
import BoardSessionError from '@/components/board-session/BoardSessionError';
import NoTableScreen from '@/components/board-session/NoTableScreen';
import { useBoardSession } from './BoardSessionProvider';
import { isBrowsableWithoutTable } from './browsable-routes';

function assertNever(value: never): never {
  throw new Error(`status de mesa não tratado: ${String(value)}`);
}

export function BoardSessionGate({ children }: PropsWithChildren): React.ReactElement {
  const { status } = useBoardSession();
  const pathname = usePathname();

  switch (status) {
    case 'no-table':
      return <NoTableScreen />;
    case 'browsing':
      return isBrowsableWithoutTable(pathname) ? <>{children}</> : <NoTableScreen />;
    case 'error':
      return <BoardSessionError />;
    case 'loading':
    case 'ready':
      return <>{children}</>;
    default:
      return assertNever(status);
  }
}
