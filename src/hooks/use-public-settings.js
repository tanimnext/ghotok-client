'use client';

import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/endpoints';

/** Site settings that are safe for anyone to read (support contacts, tutorial links…). */
export function usePublicSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: contentApi.publicSettings,
    staleTime: 5 * 60_000,
  });
}
