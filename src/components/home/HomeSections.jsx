import Link from 'next/link';
import { RELIGIONS } from '@/shared';
import { BiodataCard } from '@/components/biodata/BiodataCard';
import { LogoMark } from '@/components/layout/Logo';
import { Button, Heading } from '@/ui';
import { digits, number, taka } from '@/lib/format';

// The remaining home page bands. They are Server Components that receive the
// translator and data from app/(site)/page.jsx.

export function FaithBand({ t, lang }) {
  const other = lang === 'bn' ? 'en' : 'bn';
  return (
    <section className="container-page flex flex-col items-center gap-8 pb-6 pt-20 text-center">
      <div className="flex w-full max-w-[700px] items-center gap-4">
        <span className="h-px flex-1 bg-gold" />
        <span className="font-display text-[clamp(22px,3vw,30px)] italic text-rose-text">
          {t('home.faithsTitle')}
        </span>
        <span className="h-px flex-1 bg-gold" />
      </div>
      <div className="flex flex-wrap justify-center gap-3.5">
        {RELIGIONS.filter((r) => r.value !== 'other').map((r) => (
          <Link
            key={r.value}
            href={`/biodatas?religion=${r.value}`}
            className="flex items-baseline gap-2.5 rounded-full border border-line bg-surface px-8 py-4 hover:border-gold"
          >
            <span className="font-display text-2xl font-semibold">{r[lang]}</span>
            <span className="text-sm text-muted">{r[other]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function StatsBand({ t, lang, stats }) {
  if (!stats?.show) return null;
  const items = [
    [stats.biodatas, 'home.stats.biodatas'],
    [stats.grooms, 'home.stats.grooms'],
    [stats.brides, 'home.stats.brides'],
    [stats.marriages, 'home.stats.marriages'],
  ];
  return (
    <section className="container-page grid grid-cols-2 gap-5 pb-6 pt-12 text-center md:grid-cols-4">
      {items.map(([value, key]) => (
        <div key={key} className="flex flex-col gap-1.5">
          <span className="font-display text-[44px] font-medium leading-tight text-rose-text sm:text-[52px]">
            {number(value, lang)}
            {key === 'home.stats.marriages' && value > 0 ? '+' : ''}
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.04em] text-muted">{t(key)}</span>
        </div>
      ))}
    </section>
  );
}

export function HowItWorks({ t }) {
  return (
    <section id="how" className="container-page scroll-mt-24 pb-10 pt-24">
      <div className="mb-14 flex max-w-[700px] flex-col gap-3.5">
        <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-gold-text">
          {t('home.howK')}
        </span>
        <Heading>{t('home.howT')}</Heading>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {t('home.steps').map((s) => (
          <li key={s.n} className="flex flex-col gap-3.5 border-t-[1.5px] border-gold py-2 pr-8">
            <span className="mt-5 font-display text-[56px] font-medium leading-none text-gold-text">
              {s.n}
            </span>
            <h3 className="text-[21px] font-bold">{s.t}</h3>
            <p className="text-base leading-[1.7] text-muted">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FeaturedBiodatas({ t, items }) {
  return (
    <section className="container-page pb-10 pt-24">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-3.5">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-gold-text">
            {t('home.featK')}
          </span>
          <Heading>{t('home.featT')}</Heading>
        </div>
        <Link
          href="/biodatas"
          className="border-b-[1.5px] border-gold pb-1 text-base font-bold text-rose-text"
        >
          {t('home.viewAll')} →
        </Link>
      </div>
      {items.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((b) => (
            <BiodataCard key={b.id} biodata={b} />
          ))}
        </div>
      ) : (
        <p className="text-muted">{t('home.noFeatured')}</p>
      )}
    </section>
  );
}

export function SafetyPanel({ t }) {
  return (
    <section id="safety" className="scroll-mt-24 px-4 pt-24 sm:px-7">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-12 rounded-[40px] bg-panel px-6 py-14 text-on-panel sm:px-14 sm:py-[72px]">
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-panel-gold">
            {t('home.safeK')}
          </span>
          <h2 className="font-display text-[clamp(32px,4.2vw,50px)] font-medium leading-title tracking-[-0.015em]">
            {t('home.safeT')}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-9 md:grid-cols-3">
          {t('home.safe').map((s) => (
            <div key={s.t} className="flex flex-col gap-3.5 border-t border-panel-line pt-6">
              <h3 className="font-display text-[25px] font-semibold leading-snug">{s.t}</h3>
              <p className="text-base leading-[1.75] text-panel-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingTeaser({ t, lang, packages }) {
  return (
    <section className="container-page flex flex-wrap items-center gap-14 pb-10 pt-[104px]">
      <div className="flex min-w-0 flex-1 basis-[400px] flex-col gap-4">
        <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-gold-text">
          {t('home.priceK')}
        </span>
        <Heading>{t('home.priceT')}</Heading>
        <p className="text-lg leading-[1.75] text-muted">{t('home.priceD')}</p>
        <div className="flex flex-wrap gap-2.5">
          {['bKash', 'Nagad', 'Rocket'].map((m) => (
            <span key={m} className="rounded-full border border-gold px-[18px] py-2 text-sm font-bold">
              {m}
            </span>
          ))}
        </div>
      </div>
      <div className="grid min-w-0 flex-1 basis-[460px] grid-cols-1 gap-5 sm:grid-cols-2">
        {packages.map((p) => (
          <div
            key={p.id}
            className={`flex flex-col gap-3 rounded-[32px] bg-surface px-8 py-8 ${p.highlight ? 'border-2 border-gold' : 'border border-line'}`}
          >
            <span
              className={`text-sm font-bold uppercase tracking-[0.1em] ${p.highlight ? 'text-rose-text' : 'text-muted'}`}
            >
              {p.name[lang] || p.name.en}
            </span>
            <span className="font-display text-[56px] font-medium leading-tight sm:text-[64px]">
              {taka(p.price, lang)}
            </span>
            <span className="text-[17px] font-bold">
              {t('common.connections', { n: digits(p.connections, lang) })}
            </span>
            <span className="text-sm text-muted">{t('home.per', { n: number(p.perConnection, lang) })}</span>
            <Button
              href={`/packages?package=${p.id}`}
              variant={p.highlight ? 'primary' : 'outline'}
              className="mt-3.5"
            >
              {t('home.choosePlan')}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ClosingCta({ t }) {
  return (
    <section className="container-page pb-24 pt-[72px]">
      <div className="flex flex-col items-center gap-5 rounded-t-full rounded-b-[40px] border-[1.5px] border-gold bg-surface2 px-6 pb-16 pt-20 text-center sm:px-10 sm:pb-[72px] sm:pt-[88px]">
        <LogoMark size={64} />
        <h2 className="max-w-[760px] font-display text-[clamp(32px,4.6vw,56px)] font-medium leading-title tracking-[-0.015em]">
          {t('home.ctaT')}
        </h2>
        <p className="text-lg text-muted">{t('home.ctaD')}</p>
        <Button href="/register" size="lg" className="mt-2">
          {t('nav.create')}
        </Button>
      </div>
    </section>
  );
}
