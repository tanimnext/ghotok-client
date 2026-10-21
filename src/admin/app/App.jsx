import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router';
import { can } from '@/shared';
import { EmptyState, LoadingBlock, UiProvider } from '@/ui';
import { AdminLayout } from '../components/layout/AdminLayout.jsx';
import { RouterLink } from '../components/RouterLink.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { AppProviders } from '../providers/AppProviders.jsx';
import { useT } from '../providers/PreferencesProvider.jsx';
import { ROUTES } from './routes.js';

export const ADMIN_BASE = '/admin';

/**
 * Only admins get past this point. Visitors go to the website's login page (and
 * come back here afterwards); signed-in members go to their own dashboard.
 */
function RequireAdmin() {
  const { user, isAdmin, isLoading } = useAuth();
  const { t } = useT();
  const router = useRouter();
  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    else if (!isAdmin) router.replace('/dashboard');
  }, [isLoading, user, isAdmin, router]);
  if (!user || !isAdmin) return <LoadingBlock label={t('common.loading')} />;
  return <Outlet />;
}

/** Renders a page only when the staff member's role has its permission. */
function Guarded({ permission, element: Page }) {
  const { user } = useAuth();
  const { t } = useT();
  if (!can(user.role, permission)) return <EmptyState icon="lock">{t('common.noAccess')}</EmptyState>;
  return (
    <Suspense fallback={<LoadingBlock label={t('common.loading')} />}>
      <Page />
    </Suspense>
  );
}

const router = createBrowserRouter(
  [
    {
      element: <RequireAdmin />,
      children: [
        {
          element: <AdminLayout />,
          children: ROUTES.map((r) => ({
            path: r.path,
            element: <Guarded permission={r.permission} element={r.element} />,
          })),
        },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  { basename: ADMIN_BASE },
);

export function App() {
  return (
    <AppProviders>
      <UiProvider linkComponent={RouterLink}>
        <RouterProvider router={router} />
      </UiProvider>
    </AppProviders>
  );
}
