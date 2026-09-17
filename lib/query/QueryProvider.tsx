'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // This is a live operator console, not a content site — a stale read here is an operator
        // making a decision off numbers that are already wrong. 20s keeps rapid navigation between
        // pages from re-fetching on every mount, while still catching up quickly after a mutation
        // anywhere else in the app invalidates the relevant query key.
        staleTime: 20_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
}

/**
 * Server-state cache for every network call this console makes. Lazily created per component
 * instance (same reasoning as StoreProvider: a module-scope singleton would leak one operator's
 * cached data into another's session if this were ever server-rendered).
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
