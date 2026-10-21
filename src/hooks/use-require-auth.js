'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './use-auth.js';

/**
 * Wraps an action that needs a signed-in member: visitors are sent to the login
 * page and brought back here afterwards.
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  return (action) =>
    (...args) => {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return undefined;
      }
      return action(...args);
    };
}
