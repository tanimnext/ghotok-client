import { ContactForm } from '@/components/content/ContactForm';
import { Icon } from '@/ui';
import { getPublicOr } from '@/lib/api/server';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('pages.contactTitle'), description: t('pages.contactSub') };
}

export default async function ContactPage() {
  const { t } = await getTranslator();
  const { site = {} } = await getPublicOr({ site: {} }, '/public/settings', { revalidate: 300 });
  return (
    <div className="container-page flex flex-col gap-10 pb-24 pt-14 lg:flex-row">
      <div className="flex flex-col gap-4 lg:w-[380px]">
        <div className="kicker">{t('nav.contact')}</div>
        <h1 className="font-display text-[clamp(34px,4.4vw,52px)] font-medium leading-title">
          {t('pages.contactTitle')}
        </h1>
        <p className="text-lg leading-relaxed text-muted">{t('pages.contactSub')}</p>
        <div className="mt-4 flex flex-col gap-3 text-[15px]">
          {site.supportEmail && (
            <a
              href={`mailto:${site.supportEmail}`}
              className="flex items-center gap-3 font-semibold hover:text-rose-text"
            >
              <Icon name="mail" className="text-gold-text" /> {site.supportEmail}
            </a>
          )}
          {site.supportPhone && (
            <a
              href={`tel:${site.supportPhone}`}
              className="flex items-center gap-3 font-semibold hover:text-rose-text"
            >
              <Icon name="phone" className="text-gold-text" /> {site.supportPhone}
            </a>
          )}
          {site.address && <p className="text-muted">{site.address}</p>}
        </div>
      </div>
      <div className="flex-1">
        <ContactForm />
      </div>
    </div>
  );
}
