import { getPublicOr } from '@/lib/api/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const STATIC = [
  '',
  '/biodatas',
  '/packages',
  '/about',
  '/guide',
  '/faq',
  '/contact',
  '/success-stories',
  '/banners',
  '/privacy-policy',
  '/terms',
  '/refund-policy',
  '/child-safety',
];

/** Static pages plus the most recent approved biodatas. Regenerated hourly. */
export const revalidate = 3600;

export default async function sitemap() {
  const { items } = await getPublicOr({ items: [] }, '/biodatas?limit=48&sort=newest', { revalidate });
  return [
    ...STATIC.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: 'weekly',
      priority: path === '' ? 1 : 0.6,
    })),
    ...items.map((b) => ({
      url: `${SITE_URL}/biodatas/${b.biodataNo}`,
      lastModified: b.approvedAt,
      changeFrequency: 'weekly',
      priority: 0.5,
    })),
  ];
}
