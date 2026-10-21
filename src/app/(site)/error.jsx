'use client';

import { useEffect } from 'react';
import { Button } from '@/ui';
import { useT } from '@/providers/PreferencesProvider';

/** Shown when a page fails to render, e.g. while the API is unreachable. */
export default function SiteError({ error, reset }) {
  const { t } = useT();
  useEffect(() => console.error(error), [error]);
  return (
    <div className="container-page flex flex-col items-center gap-5 py-24 text-center">
      <h1 className="font-display text-4xl font-medium">{t('common.somethingWrong')}</h1>
      <Button onClick={reset}>{t('common.tryAgain')}</Button>
    </div>
  );
}
