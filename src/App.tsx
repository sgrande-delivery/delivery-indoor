'use client';

import React, { PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from '@/components/shell/AppShell';
import { ToastProvider } from '@/components/ui';
import ConnectivityProvider from '@/providers/connectivity/ConnectivityProvider';
import ThemeProvider from './providers/theme/ThemeProvider';
import RestaurantBrandStyles from './providers/theme/RestaurantBrandStyles';
import { BoardSessionGate, BoardSessionProvider } from '@/providers/board-session';
import { PersonProvider } from '@/providers/person';

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { refetchOnWindowFocus: false, refetchOnReconnect: false, retry: 2 },
    },
  });
}

const App: React.FC<PropsWithChildren> = ({ children }) => {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RestaurantBrandStyles />
        <ToastProvider>
          <ConnectivityProvider>
            <BoardSessionProvider>
              <PersonProvider>
                <AppShell>
                  <BoardSessionGate>{children}</BoardSessionGate>
                </AppShell>
              </PersonProvider>
            </BoardSessionProvider>
          </ConnectivityProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
