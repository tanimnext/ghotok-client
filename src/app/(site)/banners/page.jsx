import { EmptyState } from '@/ui';
import { BannerDownload } from '@/components/content/BannerDownload';
import { getPublicOr } from '@/lib/api/server';
import { number } from '@/lib/format';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('banners.title'), description: t('banners.sub') };
}

export default async function BannersPage() {
  const { t, lang } = await getTranslator();
  // Preview links are signed for an hour, so the list is refreshed well within that.
  const { items } = await getPublicOr({ items: [] }, '/public/banners', { revalidate: 300 });
  return (
    <div className="container-page pb-24 pt-14">
      <div className="kicker mb-4">{t('banners.kicker')}</div>
      <h1 className="font-display text-[clamp(34px,4.4vw,52px)] font-medium leading-title">
        {t('banners.title')}
      </h1>
      <p className="mb-10 mt-3 max-w-2xl text-lg text-muted">{t('banners.sub')}</p>
      {items.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <article
              key={b.id}
              className="flex flex-col gap-4 overflow-hidden rounded-[28px] border border-line bg-surface p-4"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-[20px] bg-surface2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.imageUrl}
                  alt={b.title[lang] || b.title.en}
                  className="size-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-1 px-2">
                <h2 className="text-lg font-bold">{b.title[lang] || b.title.en}</h2>
                <span className="text-sm text-muted">
                  {t('banners.downloads', { n: number(b.downloads, lang) })}
                </span>
              </div>
              <BannerDownload id={b.id} href={b.downloadUrl} />
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon="file" title={t('banners.empty')} />
      )}
    </div>
  );
}
