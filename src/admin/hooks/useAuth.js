import { can, isAdmin } from '@/shared';
import { useAuth as useSessionUser } from '@/hooks/use-auth';

// The admin dashboard uses the website's Better Auth session (hooks/use-auth.js).
export { AUTH_KEY, useLogout } from '@/hooks/use-auth';

/** The signed-in member and whether they are an admin. */
export function useAuth() {
  const { user, isLoading } = useSessionUser();
  return { user, isAdmin: !!user && isAdmin(user.role), isLoading };
}

/** True when the signed-in admin's role has `permission`. */
export function useCan() {
  const { user } = useAuth();
  return (permission) => !!user && can(user.role, permission);
}
