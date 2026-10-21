'use client';

import { Icon } from '@/ui';
import { usePreferences } from '@/providers/PreferencesProvider';

function Segment({ label, children }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full border border-line bg-surface p-[3px]">
      {children}
    </div>
  );
}

function Option({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`flex h-9 min-w-11 items-center justify-center rounded-full px-3 text-[13px] font-bold transition ${
        active ? 'bg-rose text-on-rose' : 'text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

/** EN/বাং and light/dark switches. */
export function PreferenceToggles() {
  const { lang, theme, setLang, setTheme, t } = usePreferences();
  return (
    <div className="flex items-center gap-2">
      <Segment label={t('common.language')}>
        <Option active={lang === 'en'} onClick={() => setLang('en')} label="English">
          EN
        </Option>
        <Option active={lang === 'bn'} onClick={() => setLang('bn')} label="বাংলা">
          বাং
        </Option>
      </Segment>
      <Segment label={t('common.theme')}>
        <Option active={theme === 'light'} onClick={() => setTheme('light')} label={t('common.light')}>
          <Icon name="sun" size={18} />
        </Option>
        <Option active={theme === 'dark'} onClick={() => setTheme('dark')} label={t('common.dark')}>
          <Icon name="moon" size={18} />
        </Option>
      </Segment>
    </div>
  );
}
