'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/ui';
import { useT } from '@/providers/PreferencesProvider';
import { AccountMenu } from './AccountMenu.jsx';
import { Logo } from './Logo.jsx';
import { PreferenceToggles } from './PreferenceToggles.jsx';

export const NAV_LINKS = [
  { href: '/', key: 'nav.home' },
  { href: '/biodatas', key: 'nav.browse' },
  { href: '/#how', key: 'nav.how' },
  { href: '/packages', key: 'nav.pricing' },
  { href: '/#safety', key: 'nav.safety' },
];

function isActive(pathname, href) {
  if (href.includes('#')) return false;
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function SiteHeader() {
  const { t } = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigation.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      <div className="container-page flex min-h-[72px] items-center justify-between gap-5 lg:min-h-[84px]">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-7 text-[15px] font-semibold lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(pathname, l.href) ? 'page' : undefined}
              className="hover:text-rose-text aria-[current=page]:text-rose-text"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <PreferenceToggles />
          <AccountMenu />
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={t('common.menu')}
          className="flex size-12 items-center justify-center rounded-full border border-line bg-surface lg:hidden"
        >
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="border-t border-line bg-bg lg:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-4 text-lg font-semibold">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-3 hover:bg-surface2"
              >
                {t(l.key)}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-4 border-t border-line pt-4">
              <PreferenceToggles />
              <AccountMenu onNavigate={() => setOpen(false)} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
