import Link from 'next/link';
import { getPublicOr } from '@/lib/api/server';
import { getTranslator } from '@/lib/preferences.server';
import { digits } from '@/lib/format';
import { LogoMark } from './Logo.jsx';

const COLUMNS = [
  {
    title: 'footer.platform',
    links: [
      ['/biodatas', 'nav.browse'],
      ['/packages', 'nav.pricing'],
      ['/#how', 'nav.how'],
      ['/success-stories', 'nav.stories'],
      ['/banners', 'nav.banners'],
      ['/about', 'nav.about'],
    ],
  },
  {
    title: 'footer.support',
    links: [
      ['/faq', 'nav.faq'],
      ['/guide', 'nav.guide'],
      ['/contact', 'nav.contact'],
    ],
  },
  {
    title: 'footer.policies',
    links: [
      ['/privacy-policy', 'footer.privacy'],
      ['/terms', 'footer.terms'],
      ['/refund-policy', 'footer.refund'],
      ['/child-safety', 'footer.childSafety'],
    ],
  },
];

export async function SiteFooter() {
  const { t, lang } = await getTranslator();
  const settings = await getPublicOr({ site: {} }, '/public/settings', { revalidate: 300 });
  const site = settings.site ?? {};
  const socials = [
    ['Facebook', site.facebook],
    ['YouTube', site.youtube],
    ['Instagram', site.instagram],
  ].filter(([, url]) => url);

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page flex flex-wrap justify-between gap-12 py-16">
        <div className="flex max-w-sm flex-1 basis-72 flex-col gap-4">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="font-display text-[26px] font-semibold">Ghotok</span>
            <span className="font-display text-[17px] text-muted">ঘটক</span>
          </div>
          <p className="text-[15px] leading-relaxed text-muted">{site.tagline?.[lang] ?? t('footer.tag')}</p>
          {site.supportEmail && (
            <a href={`mailto:${site.supportEmail}`} className="text-sm text-muted hover:text-rose-text">
              {site.supportEmail}
            </a>
          )}
          {site.appUrl && (
            <a
              href={site.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full border-[1.5px] border-gold px-5 py-2.5 text-sm font-bold hover:bg-surface2"
            >
              {t('footer.getApp')}
            </a>
          )}
          {socials.length > 0 && (
            <div className="flex gap-4 text-sm font-semibold">
              {socials.map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-text"
                >
                  {name}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-14 text-[15px]">
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <b>{t(col.title)}</b>
              {col.links.map(([href, key]) => (
                <Link key={href} href={href} className="text-muted hover:text-rose-text">
                  {t(key)}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="container-page border-t border-line py-5 text-[13px] text-muted">
        {t('footer.rights', { year: digits(new Date().getFullYear(), lang) })}
      </div>
    </footer>
  );
}
