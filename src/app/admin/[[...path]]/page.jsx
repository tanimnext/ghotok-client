'use client';

import dynamic from 'next/dynamic';
import { LoadingBlock } from '@/ui';

// The admin dashboard is a React Router app (src/admin) rendered only in the
// browser; it guards itself (admins only) and handles every /admin/* path.
const AdminApp = dynamic(() => import('@/admin/app/App.jsx').then((m) => m.App), {
  ssr: false,
  loading: () => <LoadingBlock label="…" />,
});

export default function AdminPage() {
  return <AdminApp />;
}
