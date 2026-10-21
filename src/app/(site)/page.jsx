import { Hero } from '@/components/home/Hero';
import { HomeSearch } from '@/components/home/HomeSearch';
import {
  ClosingCta,
  FaithBand,
  FeaturedBiodatas,
  HowItWorks,
  PricingTeaser,
  SafetyPanel,
  StatsBand,
} from '@/components/home/HomeSections';
import { SuccessStoriesBand } from '@/components/content/SuccessStories';
import { getPublicOr } from '@/lib/api/server';
import { getTranslator } from '@/lib/preferences.server';

export default async function HomePage() {
  const { t, lang } = await getTranslator();
  const [stats, featured, catalogue, stories] = await Promise.all([
    getPublicOr(null, '/public/stats', { revalidate: 60 }),
    getPublicOr({ items: [] }, '/biodatas/featured?limit=4', { revalidate: 60 }),
    getPublicOr({ packages: [] }, '/packages', { revalidate: 300 }),
    getPublicOr({ items: [] }, '/public/success-stories', { revalidate: 300 }),
  ]);
  return (
    <>
      <Hero t={t} lang={lang} />
      <HomeSearch />
      <FaithBand t={t} lang={lang} />
      <StatsBand t={t} lang={lang} stats={stats} />
      <HowItWorks t={t} />
      <FeaturedBiodatas t={t} items={featured.items} />
      <SafetyPanel t={t} />
      <SuccessStoriesBand t={t} lang={lang} items={stories.items} />
      <PricingTeaser t={t} lang={lang} packages={catalogue.packages.slice(0, 2)} />
      <ClosingCta t={t} />
    </>
  );
}
