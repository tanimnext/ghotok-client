// Language and theme preferences, stored in cookies so the server renders the
// right language and colours on the first request (no flash).
export const LANG_COOKIE = 'gh_lang';
export const THEME_COOKIE = 'gh_theme';
export const THEMES = ['light', 'dark'];
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Browser only: remembers a preference for a year. */
export function savePreference(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function resolveTheme(value) {
  return THEMES.includes(value) ? value : 'light';
}
