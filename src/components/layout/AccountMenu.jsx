'use client';

import Link from 'next/link';
import { Button } from '@/ui';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/providers/PreferencesProvider';

/**
 * "Log in / Create free biodata" for visitors, "My dashboard" + avatar for members,
 * "Admin dashboard" for admins.
 */
export function AccountMenu({ onNavigate }) {
  const { user, isLoading } = useAuth();
  const { t } = useT();
  if (isLoading) return <div className="h-12 w-40" aria-hidden="true" />;
  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/login"
          onClick={onNavigate}
          className="px-3 py-2.5 text-[15px] font-semibold hover:text-rose-text"
        >
          {t('nav.login')}
        </Link>
        <Button href="/register" onClick={onNavigate}>
          {t('nav.create')}
        </Button>
      </div>
    );
  }
  const admin = user.role === 'admin';
  return (
    <Link
      href={admin ? '/admin' : '/dashboard'}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-full py-1 pl-4 pr-1 hover:bg-surface2"
    >
      <span className="text-[15px] font-semibold">{t(admin ? 'nav.adminDashboard' : 'nav.dashboard')}</span>
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full border border-gold bg-surface2 font-display text-lg font-semibold"
      >
        {user.name?.trim()?.[0]?.toUpperCase() ?? '?'}
      </span>
    </Link>
  );
}
