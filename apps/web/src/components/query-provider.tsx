'use client';

import {
  QueryClient,
  QueryClientProvider,
  HydrationBoundary,
} from '@tanstack/react-query';
import React from 'react';

export function QueryProvider({
  state,
  children,
}: {
  state?: import('@tanstack/react-query').DehydratedState | null | undefined;
  children: React.ReactNode;
}) {
  const [client] = React.useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <HydrationBoundary state={state}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
