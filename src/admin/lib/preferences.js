// Language and theme live in the same cookies as on the website (gh_lang, gh_theme).
const ONE_YEAR = 60 * 60 * 24 * 365;

export function readCookie(name) {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${name}=`))
    ?.split('=')[1];
}

export function writeCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}
