import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BIODATA_TYPES, DISTRICTS, MARITAL_STATUS, optionLabel } from '@/shared';
import { BiodataActions, ReportBiodata } from '@/components/biodata/BiodataActions';
import { BiodataSections } from '@/ui';
import { ContactPanel } from '@/components/biodata/ContactPanel';
import { Icon, Pill } from '@/ui';
import { getPublic } from '@/lib/api/server';
import { date, digits, number } from '@/lib/format';
import { getTranslator } from '@/lib/preferences.server';

const NUMBER = /^GH-\d{1,10}$/i;

async function load(no) {
  if (!NUMBER.test(no)) return null;
  return (await getPublic(`/biodatas/${no.toUpperCase()}`))?.biodata ?? null;
}

export async function generateMetadata({ params }) {
  const { no } = await params;
  const { t, lang } = await getTranslator();
  const b = await load(no);
  if (!b) return { title: t('common.notFoundTitle') };
  const type = optionLabel(BIODATA_TYPES, b.type, lang);
  return {
    title: `${t('home.fcId', { no: b.biodataNo })} · ${type}`,
    description: [
      type,
      b.age && t('common.yearsLong', { n: digits(b.age, lang) }),
      optionLabel(DISTRICTS, b.district, lang),
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

export default async function BiodataPage({ params }) {
  const { no } = await params;
  const { t, lang } = await getTranslator();
  const b = await load(no);
  if (!b) notFound();

  const summary = [
    optionLabel(BIODATA_TYPES, b.type, lang),
    b.age && t('common.yearsLong', { n: digits(b.age, lang) }),
    optionLabel(MARITAL_STATUS, b.maritalStatus, lang),
    optionLabel(DISTRICTS, b.district, lang),
  ].filter(Boolean);

  return (
    <div className="container-page flex flex-col gap-6 pb-20 pt-7">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-rose-text">
          {t('nav.home')}
        </Link>{' '}
        /{' '}
        <Link href="/biodatas" className="hover:text-rose-text">
          {t('browse.title')}
        </Link>{' '}
        / {b.biodataNo}
      </nav>

      <div className="flex flex-col items-start gap-7 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-5">
          <section className="flex flex-wrap items-center gap-6 rounded-[28px] border border-line bg-surface p-6 sm:p-8">
            <div className="flex size-[104px] flex-none items-center justify-center rounded-full border border-gold bg-surface2">
              <Icon name="user" size={52} strokeWidth={1.8} className="text-rose-text" />
            </div>
            <div className="flex min-w-[240px] flex-1 flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {b.verified?.phone && (
                  <Pill tone="sage">
                    <Icon name="phone" size={13} strokeWidth={2.4} /> {t('detail.phoneVerified')}
                  </Pill>
                )}
                {b.verified?.email && (
                  <Pill tone="sage">
                    <Icon name="mail" size={13} strokeWidth={2.4} /> {t('detail.emailVerified')}
                  </Pill>
                )}
                <Pill tone="rose">{t('detail.approved')}</Pill>
              </div>
              <h1 className="font-display text-[32px] font-medium leading-title">
                {t('home.fcId', { no: b.biodataNo })}
              </h1>
              <p className="text-base text-muted">{summary.join(' · ')}</p>
              <p className="text-[13px] text-muted">
                {t('detail.views', { n: number(b.views, lang) })} ·{' '}
                {t('detail.lastUpdated', { date: date(b.updatedAt, lang) })}
              </p>
            </div>
            <BiodataActions biodataNo={b.biodataNo} />
          </section>
          <BiodataSections sections={b.sections} lang={lang} />
        </div>

        <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-28 lg:w-[360px] lg:flex-none">
          <ContactPanel biodataNo={b.biodataNo} />
          <section className="flex flex-col gap-2 rounded-[20px] bg-sage-bg p-6">
            <b className="text-[15px] text-sage">{t('detail.stayTitle')}</b>
            <p className="text-sm leading-relaxed text-ink">{t('detail.stayText')}</p>
          </section>
          <ReportBiodata biodataNo={b.biodataNo} />
        </aside>
      </div>
    </div>
  );
}
