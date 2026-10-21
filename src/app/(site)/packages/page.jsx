import { Checkout } from '@/components/billing/Checkout';
import { EmptyState } from '@/ui';
import { getPublic, getPublicOr } from '@/lib/api/server';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('packages.title'), description: t('packages.sub') };
}

export default async function PackagesPage({ searchParams }) {
  const { t } = await getTranslator();
  const { package: packageId } = await searchParams;
  const [catalogue, settings] = await Promise.all([
    getPublic('/packages'),
    getPublicOr({}, '/public/settings', { revalidate: 300 }),
  ]);
  return (
    <div className="container-page flex flex-col gap-9 pb-20 pt-10">
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="font-display text-[40px] font-medium leading-title">{t('packages.title')}</h1>
        <p className="text-[17px] leading-relaxed text-muted">{t('packages.sub')}</p>
      </div>
      {catalogue?.packages?.length ? (
        <Checkout catalogue={catalogue} initialPackageId={packageId} settings={settings} />
      ) : (
        <EmptyState icon="card" title={t('packages.unavailable')} />
      )}
    </div>
  );
}
