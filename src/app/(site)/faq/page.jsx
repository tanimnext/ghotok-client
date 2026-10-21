import Link from 'next/link';
import { Icon } from '@/ui';
import { getPublicOr } from '@/lib/api/server';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('pages.faqTitle'), description: t('pages.faqSub') };
}

export default async function FaqPage() {
  const { t, lang } = await getTranslator();
  const { items } = await getPublicOr({ items: [] }, '/public/faqs', { revalidate: 300 });
  return (
    <div className="container-page max-w-3xl pb-24 pt-14">
      <div className="kicker mb-4">{t('nav.faq')}</div>
      <h1 className="font-display text-[clamp(34px,4.4vw,52px)] font-medium leading-title">
        {t('pages.faqTitle')}
      </h1>
      <p className="mb-10 mt-3 text-lg text-muted">{t('pages.faqSub')}</p>
      <div className="flex flex-col gap-3">
        {items.map((f) => (
          <details
            key={f.id}
            className="group rounded-[24px] border border-line bg-surface px-6 py-5 open:border-gold"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold">
              {f.question[lang] || f.question.en}
              <Icon name="plus" className="flex-none text-gold-text transition group-open:rotate-45" />
            </summary>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">
              {f.answer[lang] || f.answer.en}
            </p>
          </details>
        ))}
      </div>
      <p className="mt-10 text-muted">
        <Link href="/contact" className="font-bold text-rose-text">
          {t('nav.contact')} →
        </Link>
      </p>
    </div>
  );
}
