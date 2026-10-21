import { EmptyState } from '@/ui';
import { StoryCard } from '@/components/content/SuccessStories';
import { getPublicOr } from '@/lib/api/server';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('stories.title'), description: t('stories.sub') };
}

export default async function SuccessStoriesPage() {
  const { t, lang } = await getTranslator();
  const { items } = await getPublicOr({ items: [] }, '/public/success-stories', { revalidate: 300 });
  return (
    <div className="container-page pb-24 pt-14">
      <div className="kicker mb-4">{t('stories.kicker')}</div>
      <h1 className="font-display text-[clamp(34px,4.4vw,52px)] font-medium leading-title">
        {t('stories.title')}
      </h1>
      <p className="mb-10 mt-3 max-w-2xl text-lg text-muted">{t('stories.sub')}</p>
      {items.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <StoryCard key={s.id} t={t} lang={lang} story={s} />
          ))}
        </div>
      ) : (
        <EmptyState icon="heart" title={t('stories.empty')} />
      )}
    </div>
  );
}
