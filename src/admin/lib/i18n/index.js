import { createTranslator as createSharedTranslator } from '@/shared';
import bn from './bn.js';
import en from './en.js';

// Admin interface text. en.js and bn.js must have the same keys (test/admin-i18n.test.js).
export const dictionaries = { en, bn };

export const resolveLang = (value) => (value === 'bn' ? 'bn' : 'en');

export function createTranslator(lang) {
  return createSharedTranslator(dictionaries[resolveLang(lang)], en);
}
