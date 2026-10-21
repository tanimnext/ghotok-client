import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createTranslator, resolveLang } from '../lib/i18n/index.js';
import { readCookie, writeCookie } from '../lib/preferences.js';

const PreferencesContext = createContext(null);

/** Language and theme for the panel (shared cookies with the website). */
export function PreferencesProvider({ children }) {
  const [lang, setLangState] = useState(() => resolveLang(readCookie('gh_lang')));
  const [theme, setThemeState] = useState(() => (readCookie('gh_theme') === 'dark' ? 'dark' : 'light'));

  const setLang = useCallback((next) => {
    writeCookie('gh_lang', next);
    document.documentElement.lang = next;
    setLangState(next);
  }, []);
  const setTheme = useCallback((next) => {
    writeCookie('gh_theme', next);
    document.documentElement.dataset.theme = next;
    setThemeState(next);
  }, []);

  const value = useMemo(
    () => ({ lang, theme, setLang, setTheme, t: createTranslator(lang) }),
    [lang, theme, setLang, setTheme],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}

export const useT = () => {
  const { t, lang } = usePreferences();
  return { t, lang };
};
