import { cookies } from 'next/headers';
import { createTranslator, resolveLang } from './i18n/index.js';
import { LANG_COOKIE, THEME_COOKIE, resolveTheme } from './preferences.js';

/** Server Components: the visitor's language and theme. */
export async function getPreferences() {
  const store = await cookies();
  return {
    lang: resolveLang(store.get(LANG_COOKIE)?.value),
    theme: resolveTheme(store.get(THEME_COOKIE)?.value),
  };
}

/** Server Components: `{ lang, t }` for the visitor's language. */
export async function getTranslator() {
  const { lang } = await getPreferences();
  return { lang, t: createTranslator(lang) };
}
