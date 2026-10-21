import '@/admin/styles.css';

export const metadata = {
  title: { default: 'Admin', template: '%s · Ghotok Admin' },
  robots: { index: false, follow: false },
};

/** The admin dashboard: a client-only React app mounted at /admin (see src/admin). */
export default function AdminLayout({ children }) {
  return children;
}
