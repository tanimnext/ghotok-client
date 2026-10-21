import { useT } from '../providers/PreferencesProvider.jsx';

/** An ApiError as text in the panel's language, falling back to the API's English message. */
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
