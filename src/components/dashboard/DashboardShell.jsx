'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/layout/Logo';
import { PreferenceToggles } from '@/components/layout/PreferenceToggles';
import { Icon, LoadingBlock } from '@/ui';
import { useAuth, useLogout } from '@/hooks/use-auth';
import { accountApi } from '@/lib/api/endpoints';
import { digits } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';
import { DASHBOARD_NAV, MOBILE_TABS, isCurrent } from './nav.js';

function NotificationBell() {
  const { t, lang } = useT();
  const { data } = useQuery({
    queryKey: ['notifications', 1],
    queryFn: () => accountApi.notifications(1),
    refetchInterval: 60_000,
  });
  const unread = data?.unread ?? 0;
  return (
    <Link
      href="/dashboard/notifications"
      aria-label={`${t('dash.nav.notifications')}${unread ? ` (${unread})` : ''}`}
      className="relative flex size-11 items-center justify-center rounded-full border border-line bg-surface hover:border-gold"
    >
      <Icon name="bell" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[11px] font-bold text-on-rose">
          {digits(Math.min(unread, 99), lang)}
        </span>
      )}
    </Link>
  );
}

function DashboardHeader({ user }) {
  const { t } = useT();
  const logout = useLogout();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-7">
        <Logo compact />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <PreferenceToggles />
          </div>
          <Link
            href="/biodatas"
            className="hidden px-3 py-2.5 text-[15px] font-semibold hover:text-rose-text sm:block"
          >
            {t('nav.browse')}
          </Link>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="rounded-full border border-gold px-4 py-2 text-[14px] font-bold hover:bg-surface2"
            >
              {t('nav.adminDashboard')}
            </Link>
          )}
          <NotificationBell />
          <span
            aria-hidden="true"
            className="hidden size-11 items-center justify-center rounded-full border border-gold bg-surface2 font-display text-lg font-semibold sm:flex"
          >
            {user.name?.trim()?.[0]?.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={() => logout.mutate()}
            aria-label={t('nav.logout')}
            className="flex size-11 items-center justify-center rounded-full hover:bg-surface2"
          >
            <Icon name="logout" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ pathname }) {
  const { t } = useT();
  return (
    <nav
      aria-label="Dashboard"
      className="hidden w-[268px] flex-none flex-col gap-1 self-start rounded-[28px] border border-line bg-surface p-3.5 text-[15px] font-semibold lg:sticky lg:top-24 lg:flex"
    >
      {DASHBOARD_NAV.map((item) => {
        const current = isCurrent(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-full px-[18px] py-3 ${current ? 'bg-rose text-on-rose' : 'hover:bg-surface2'}`}
          >
            <Icon name={item.icon} size={18} />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

/** Every dashboard section as a scrollable strip (phones and tablets). */
function SectionStrip({ pathname }) {
  const { t } = useT();
  return (
    <nav aria-label="Dashboard sections" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
      {DASHBOARD_NAV.map((item) => {
        const current = isCurrent(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold ${current ? 'bg-rose text-on-rose' : 'border border-line bg-surface'}`}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileTabBar({ pathname }) {
  const { t } = useT();
  return (
    <nav
      aria-label="Dashboard tabs"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface px-1.5 pb-3.5 pt-2 lg:hidden"
    >
      {MOBILE_TABS.map((tab) => {
        const current = isCurrent(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={current ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold ${current ? 'text-rose-text' : 'text-muted'}`}
          >
            <Icon name={tab.icon} size={24} />
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}

/** Layout for every /dashboard page. Sends visitors who are not signed in to the login page. */
export function DashboardShell({ children }) {
  const { user, isLoading } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, user, router, pathname]);

  if (!user) return <LoadingBlock label={t('common.loading')} />;

  return (
    <div className="min-h-dvh pb-24 lg:pb-0">
      <DashboardHeader user={user} />
      <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-4 pb-20 pt-6 sm:px-7 lg:pt-9">
        <Sidebar pathname={pathname} />
        <main id="main" className="flex min-w-0 flex-1 flex-col gap-6">
          <SectionStrip pathname={pathname} />
          {children}
        </main>
      </div>
      <MobileTabBar pathname={pathname} />
    </div>
  );
}

/** The heading block at the top of each dashboard page. */
export function PageTitle({ kicker, title, sub, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        {kicker && <div className="kicker">{kicker}</div>}
        <h1 className="font-display text-[clamp(30px,4vw,44px)] font-medium leading-title tracking-[-0.015em]">
          {title}
        </h1>
        {sub && <p className="text-base text-muted sm:text-[17px]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
