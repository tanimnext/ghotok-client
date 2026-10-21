import Link from 'next/link';
import { DISTRICTS, optionLabel } from '@/shared';
import { Heading } from '@/ui';
import { date } from '@/lib/format';

/** One published story. Stories carry no names: only the districts and the month. */
export function StoryCard({ t, lang, story }) {
  const places = story.districts.map((d) => optionLabel(DISTRICTS, d, lang)).join(' · ');
  return (
    <figure className="flex flex-col gap-4 rounded-[28px] border border-line bg-surface p-7">
      <span aria-hidden="true" className="font-display text-5xl leading-none text-gold-text">
        “
      </span>
      <blockquote className="whitespace-pre-line text-base leading-[1.75]">{story.story}</blockquote>
      <figcaption className="mt-auto flex flex-col gap-1 border-t border-line pt-4 text-sm text-muted">
        {places && <b className="text-ink">{places}</b>}
        <span>
          {[
            story.marriedOn &&
              t('stories.married', {
                when: date(`${story.marriedOn}-01`, lang, { month: 'long', year: 'numeric' }),
              }),
            story.viaGhotok && t('stories.viaGhotok'),
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </figcaption>
    </figure>
  );
}

/** The home page band of success stories; hidden until at least one is published. */
export function SuccessStoriesBand({ t, lang, items }) {
  if (!items.length) return null;
  return (
    <section className="container-page pb-10 pt-24">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-3.5">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-gold-text">
            {t('stories.kicker')}
          </span>
          <Heading>{t('stories.title')}</Heading>
        </div>
        <Link
          href="/success-stories"
          className="border-b-[1.5px] border-gold pb-1 text-base font-bold text-rose-text"
        >
          {t('stories.all')} →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.slice(0, 3).map((s) => (
          <StoryCard key={s.id} t={t} lang={lang} story={s} />
        ))}
      </div>
    </section>
  );
}
