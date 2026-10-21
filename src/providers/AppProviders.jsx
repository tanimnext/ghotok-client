'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ToastProvider, UiProvider } from '@/ui';
import { PreferencesProvider } from './PreferencesProvider.jsx';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Retry only server failures; a 4xx will not fix itself.
        retry: (count, error) => (error?.status ?? 500) >= 500 && count < 2,
      },
    },
  });
}

/** Every client-side context the app needs, mounted once in the root layout. */
export function AppProviders({ lang, theme, children }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider initialLang={lang} initialTheme={theme}>
        <UiProvider linkComponent={Link}>
          <ToastProvider>{children}</ToastProvider>
        </UiProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}
