import Link from 'next/link';
import { BrowseResults } from '@/components/biodata/BrowseResults';
import { SearchFilters } from '@/components/biodata/SearchFilters';
import { getPublic } from '@/lib/api/server';
import { getTranslator } from '@/lib/preferences.server';
import { pickSearch, toQueryString } from '@/lib/search-params';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('browse.title'), description: t('browse.sub') };
}

export default async function BrowsePage({ searchParams }) {
  const { t } = await getTranslator();
  const params = pickSearch(await searchParams);
  const initial = (await getPublic(`/biodatas${toQueryString(params)}`)) ?? {
    items: [],
    total: 0,
    page: 1,
    pages: 1,
  };

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page flex flex-col gap-1.5 py-8">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link href="/" className="hover:text-rose-text">
              {t('nav.home')}
            </Link>{' '}
            / {t('browse.title')}
          </nav>
          <h1 className="font-display text-4xl font-medium leading-title">{t('browse.title')}</h1>
          <p className="text-base text-muted">{t('browse.sub')}</p>
        </div>
      </div>
      <div className="container-page flex flex-col items-start gap-8 pb-20 pt-8 lg:flex-row">
        <SearchFilters key={toQueryString(params)} initial={params} />
        <BrowseResults params={params} initial={initial} />
      </div>
    </>
  );
}
