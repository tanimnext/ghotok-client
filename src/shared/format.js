import { HEIGHTS, formatNumber, optionLabel, toBnDigits } from './options.js';

// Display formatting for the front-ends, in the reader's language (Bangla uses Bangla digits).

export const number = (value, lang) => formatNumber(value ?? 0, lang);

export const taka = (value, lang) => `৳${formatNumber(value ?? 0, lang)}`;

export const digits = (value, lang) => (lang === 'bn' ? toBnDigits(value) : String(value ?? ''));

const LOCALES = { en: 'en-GB', bn: 'bn-BD' };

export function date(value, lang, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '';
  return new Intl.DateTimeFormat(LOCALES[lang] ?? 'en-GB', options).format(new Date(value));
}

export const dateTime = (value, lang) =>
  date(value, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const height = (inches, lang) => (inches ? optionLabel(HEIGHTS, inches, lang) : '');

/** Label of an option value from a shared option list. */
export const label = (options, value, lang) => optionLabel(options, value, lang);
