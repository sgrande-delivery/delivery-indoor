'use client';

import React, { PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeProvider from './providers/theme/ThemeProvider';
import RestaurantBrandStyles from './providers/theme/RestaurantBrandStyles';

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
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
