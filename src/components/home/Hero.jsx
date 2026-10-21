import { DISTRICTS, optionLabel } from '@/shared';
import { Button, Icon } from '@/ui';

/** The landing hero: headline, calls to action, trust points and the arch illustration. */
export function Hero({ t, lang }) {
  return (
    <section className="container-page flex flex-wrap items-center gap-12 pb-10 pt-12 lg:pt-[72px]">
      <div className="flex min-w-0 flex-1 basis-[520px] flex-col gap-7">
        <div className="kicker">{t('home.eyebrow')}</div>
        <h1 className="font-display text-[clamp(42px,6vw,80px)] font-medium leading-hero tracking-[-0.02em]">
          {t('home.heroA')} <em className="italic text-rose-text">{t('home.heroB')}</em>
        </h1>
        <p className="max-w-[540px] text-[17px] leading-[1.75] text-muted sm:text-[19px]">{t('home.sub')}</p>
        <div className="flex flex-wrap gap-3.5">
          <Button href="/register" size="lg">
            {t('nav.create')}
          </Button>
          <Button href="/biodatas" size="lg" variant="outline">
            {t('home.cta2')}
          </Button>
        </div>
        <ul className="mt-1.5 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-muted">
          {t('home.trust').map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Icon name="check" size={18} strokeWidth={2.4} className="text-gold-text" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <HeroArt t={t} lang={lang} />
    </section>
  );
}

function HeroArt({ t, lang }) {
  return (
    <div className="flex min-w-0 flex-1 basis-[420px] justify-center" aria-hidden="true">
      <div className="relative h-[420px] w-full max-w-[470px] sm:h-[580px]">
        <div className="absolute inset-0 rounded-t-full rounded-b-[28px] border-[1.5px] border-gold bg-surface2" />
        <div className="absolute inset-[18px] rounded-t-full rounded-b-2xl border border-dashed border-gold opacity-70" />
        <svg
          viewBox="0 0 300 300"
          className="absolute left-1/2 top-[100px] w-[240px] -translate-x-1/2 sm:top-[150px] sm:w-[300px]"
          fill="none"
        >
          <circle cx="112" cy="150" r="72" stroke="var(--gold)" strokeWidth="5" />
          <circle cx="188" cy="150" r="72" stroke="var(--rose)" strokeWidth="5" />
          <path d="M150 62l9 12-9 12-9-12z" fill="var(--gold)" />
          <path d="M44 52q0 10 10 10q-10 0-10 10q0-10-10-10q10 0 10-10z" fill="var(--gold)" />
          <path d="M262 236q0 8 8 8q-8 0-8 8q0-8-8-8q8 0 8-8z" fill="var(--rose)" />
          <path d="M250 60q0 6 6 6q-6 0-6 6q0-6-6-6q6 0 6-6z" fill="var(--gold)" />
        </svg>
        <FloatingNote
          className="-left-1 bottom-10 sm:-left-[18px] sm:bottom-16"
          icon="shield"
          iconClass="bg-sage-bg text-sage"
          title={t('home.fcId', { no: 'GH-1024' })}
          text={t('home.fcMeta', { place: optionLabel(DISTRICTS, 'dhaka', lang) })}
        />
        <FloatingNote
          className="-right-1 top-16 sm:-right-3.5 sm:top-[92px]"
          icon="heart"
          iconClass="bg-surface2 text-rose-text"
          title={t('home.fc2a')}
          text={t('home.fc2b')}
        />
      </div>
    </div>
  );
}

function FloatingNote({ className, icon, iconClass, title, text }) {
  return (
    <div
      className={`absolute flex items-center gap-3.5 rounded-[20px] border border-line bg-surface px-5 py-4 shadow-card ${className}`}
    >
      <span className={`flex size-[46px] items-center justify-center rounded-full ${iconClass}`}>
        <Icon name={icon} size={22} strokeWidth={2.2} />
      </span>
      <span className="flex flex-col gap-0.5">
        <b className="text-[15px]">{title}</b>
        <span className="text-[13px] text-muted">{text}</span>
      </span>
    </div>
  );
}
