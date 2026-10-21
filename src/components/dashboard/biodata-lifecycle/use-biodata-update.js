'use client';

import { useQueryClient } from '@tanstack/react-query';
import { MY_BIODATA_KEY } from '../biodata-editor/keys.js';

/** Stores the owner view returned by a biodata action and refreshes the dashboard summary. */
export function useBiodataUpdate() {
  const queryClient = useQueryClient();
  return (result) => {
    if (result?.biodata) queryClient.setQueryData(MY_BIODATA_KEY, result);
    else queryClient.invalidateQueries({ queryKey: MY_BIODATA_KEY });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}
