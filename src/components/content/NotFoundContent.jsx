import { Button } from '@/ui';
import { getTranslator } from '@/lib/preferences.server';

export async function NotFoundContent() {
  const { t } = await getTranslator();
  return (
    <div className="container-page flex flex-col items-center gap-5 py-24 text-center">
      <span className="font-display text-[96px] font-medium leading-none text-gold-text">404</span>
      <h1 className="font-display text-4xl font-medium">{t('common.notFoundTitle')}</h1>
      <p className="max-w-md text-muted">{t('common.notFoundText')}</p>
      <Button href="/">{t('common.goHome')}</Button>
    </div>
  );
}
