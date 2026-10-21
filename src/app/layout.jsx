import { Hind_Siliguri, Manrope, Noto_Serif_Bengali, Playfair_Display } from 'next/font/google';
import { createTranslator } from '@/lib/i18n';
import { getPreferences } from '@/lib/preferences.server';
import { AppProviders } from '@/providers/AppProviders';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});
const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-hind',
  display: 'swap',
});
const notoSerifBn = Noto_Serif_Bengali({
  subsets: ['bengali'],
  weight: ['500', '600'],
  variable: '--font-noto-serif-bn',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata() {
  const { lang } = await getPreferences();
  const t = createTranslator(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('meta.title'), template: '%s · Ghotok' },
    description: t('meta.description'),
    applicationName: 'Ghotok',
    openGraph: {
      type: 'website',
      siteName: 'Ghotok',
      title: t('meta.title'),
      description: t('meta.description'),
      locale: lang === 'bn' ? 'bn_BD' : 'en_US',
    },
  };
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF9F5' },
    { media: '(prefers-color-scheme: dark)', color: '#170E13' },
  ],
};

export default async function RootLayout({ children }) {
  const { lang, theme } = await getPreferences();
  const fonts = [playfair, manrope, hind, notoSerifBn].map((f) => f.variable).join(' ');
  return (
    <html lang={lang} data-theme={theme} className={fonts}>
      <body className="min-h-dvh">
        <AppProviders lang={lang} theme={theme}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
