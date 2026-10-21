'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authCall, authClient, toAppUser } from '@/lib/auth-client';

export const AUTH_KEY = ['auth', 'me'];

/** Reads the current Better Auth session (fresh from the server, not a cached cookie). */
export async function fetchCurrentUser() {
  try {
    return toAppUser(await authCall(authClient.getSession({ query: { disableCookieCache: true } })));
  } catch (err) {
    if (err.status === 401 || err.status === 403) return null;
    throw err;
  }
}

/** The signed-in member (with `role`), or null. `isLoading` is true until we know. */
export function useAuth() {
  // No retries: when the session cannot be read, the member is treated as signed out.
  const query = useQuery({ queryKey: AUTH_KEY, queryFn: fetchCurrentUser, staleTime: 60_000, retry: false });
  return { user: query.data ?? null, isLoading: query.isPending, refetch: query.refetch };
}

/** Reloads the session after signing in, so every component sees the member at once. */
export function useRefreshAuth() {
  const queryClient = useQueryClient();
  return async () => {
    const user = await fetchCurrentUser();
    queryClient.setQueryData(AUTH_KEY, user);
    return user;
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => authCall(authClient.signOut()),
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(AUTH_KEY, null);
      router.push('/');
      router.refresh();
    },
  });
}
