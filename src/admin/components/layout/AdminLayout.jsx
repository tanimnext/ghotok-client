import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { ROLE_OPTIONS, can, optionLabel } from '@/shared';
import { Icon } from '@/ui';
import { NAV_GROUPS, ROUTES } from '../../app/routes.js';
import { useAuth, useLogout } from '../../hooks/useAuth.js';
import { adminApi } from '../../lib/api.js';
import { usePreferences } from '../../providers/PreferencesProvider.jsx';

function Toggle({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full border border-line bg-surface p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          aria-label={o.label}
          onClick={() => onChange(o.value)}
          className={`flex h-9 min-w-11 items-center justify-center rounded-full px-3 text-[13px] font-bold ${value === o.value ? 'bg-rose text-on-rose' : 'text-muted'}`}
        >
          {o.content}
        </button>
      ))}
    </div>
  );
}

function Sidebar({ user, counts, onNavigate }) {
  const { t } = usePreferences();
  const allowed = ROUTES.filter((r) => r.nav && can(user.role, r.permission));
  return (
    <nav
      aria-label="Admin"
      className="flex h-full flex-col gap-1 overflow-y-auto bg-panel px-4 py-7 text-on-panel"
    >
      <div className="flex items-center gap-3 px-3 pb-6">
        <svg width="38" height="30" viewBox="0 0 38 30" fill="none" aria-hidden="true">
          <circle cx="13" cy="15" r="10" stroke="var(--panel-gold)" strokeWidth="2.4" />
          <circle cx="25" cy="15" r="10" stroke="#F0A3B8" strokeWidth="2.4" />
        </svg>
        <span className="font-display text-2xl font-semibold">Ghotok</span>
        <span className="rounded-full border border-panel-line px-2 py-1 text-[11px] font-bold tracking-[0.1em] text-panel-gold">
          {t('layout.admin')}
        </span>
      </div>
      {NAV_GROUPS.map((group) => {
        const items = allowed.filter((r) => r.nav.group === group);
        if (!items.length) return null;
        return (
          <div key={group} className="flex flex-col gap-1 pb-3">
            <span className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-panel-muted/70">
              {t(`nav.groups.${group}`)}
            </span>
            {items.map((r) => {
              const count = r.nav.badge ? counts?.[r.nav.badge] : 0;
              return (
                <NavLink
                  key={r.path}
                  to={r.path}
                  end={r.path === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] font-semibold ${isActive ? 'bg-panel-gold text-[#3B1624]' : 'text-panel-muted hover:bg-white/5 hover:text-on-panel'}`
                  }
                >
                  <Icon name={r.nav.icon} size={18} />
                  <span className="flex-1">{t(r.nav.key)}</span>
                  {count > 0 && (
                    <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-bold text-on-rose">
                      {count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

/** The panel's frame: dark sidebar (from the design), top bar and the current page. */
export function AdminLayout() {
  const { t, lang, theme, setLang, setTheme } = usePreferences();
  const { user } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: adminApi.overview,
    refetchInterval: 60_000,
  });

  const submitSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    if (/^GH-\d+$/i.test(q)) navigate(`/biodatas?q=${encodeURIComponent(q)}&status=all`);
    else if (/^INV-|^[A-Z0-9]{8,}$/i.test(q) && can(user.role, 'payments.manage'))
      navigate(`/payments?status=all&q=${encodeURIComponent(q)}`);
    else navigate(`/users?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-[272px] flex-none lg:block">
        <Sidebar user={user} counts={overview?.kpis} />
      </aside>
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="h-full w-[280px]">
            <Sidebar user={user} counts={overview?.kpis} onNavigate={() => setMenuOpen(false)} />
          </div>
          <button
            type="button"
            aria-label={t('common.close')}
            className="flex-1 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur sm:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t('layout.menu')}
            className="flex size-11 items-center justify-center rounded-full border border-line lg:hidden"
          >
            <Icon name="menu" />
          </button>
          <form
            onSubmit={submitSearch}
            role="search"
            className="order-last w-full sm:order-none sm:w-auto sm:flex-1"
          >
            <label className="sr-only" htmlFor="admin-search">
              {t('layout.searchPh')}
            </label>
            <input
              id="admin-search"
              type="search"
              placeholder={t('layout.searchPh')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full max-w-md rounded-full border border-line bg-surface px-5 text-sm"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Toggle
              label={t('common.language')}
              value={lang}
              onChange={setLang}
              options={[
                { value: 'en', label: 'English', content: 'EN' },
                { value: 'bn', label: 'বাংলা', content: 'বাং' },
              ]}
            />
            <Toggle
              label={t('common.theme')}
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'light', label: t('common.light'), content: <Icon name="sun" size={18} /> },
                { value: 'dark', label: t('common.dark'), content: <Icon name="moon" size={18} /> },
              ]}
            />
            <span className="hidden rounded-full border border-gold bg-surface2 px-4 py-2.5 text-[13px] font-bold text-rose-text md:inline">
              {optionLabel(ROLE_OPTIONS, user.role, lang)}
            </span>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden px-2 text-sm font-semibold text-muted hover:text-rose-text xl:inline"
            >
              {t('common.viewSite')}
            </a>
            <button
              type="button"
              onClick={() => logout.mutate()}
              aria-label={t('common.logout')}
              className="flex size-11 items-center justify-center rounded-full hover:bg-surface2"
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main
          id="main"
          key={location.pathname}
          className="flex flex-col gap-6 px-4 pb-16 pt-7 sm:px-8 lg:px-9"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
