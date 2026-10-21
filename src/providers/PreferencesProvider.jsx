'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createTranslator } from '@/lib/i18n';
import { LANG_COOKIE, THEME_COOKIE, savePreference } from '@/lib/preferences';

const PreferencesContext = createContext(null);

/**
 * Holds the visitor's language and theme on the client. Changing the language
 * saves the cookie and refreshes Server Components so the whole page re-renders
 * in the new language; changing the theme only switches CSS variables.
 */
export function PreferencesProvider({ initialLang, initialTheme, children }) {
  const router = useRouter();
  const [lang, setLangState] = useState(initialLang);
  const [theme, setThemeState] = useState(initialTheme);

  const setLang = useCallback(
    (next) => {
      savePreference(LANG_COOKIE, next);
      document.documentElement.lang = next;
      setLangState(next);
      router.refresh();
    },
    [router],
  );

  const setTheme = useCallback((next) => {
    savePreference(THEME_COOKIE, next);
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

/** `{ t, lang }` for Client Components. */
export function useT() {
  const { t, lang } = usePreferences();
  return { t, lang };
}
