'use client';

import { useT } from '@/providers/PreferencesProvider';

/**
 * Turns an ApiError into text in the reader's language: a translated message for
 * known error codes, otherwise the API's English message.
 */
export function useErrorMessage() {
  const { t } = useT();
  return (error) => {
    if (!error) return '';
    const key = `errors.${error.code}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return error.message || t('common.somethingWrong');
  };
}
