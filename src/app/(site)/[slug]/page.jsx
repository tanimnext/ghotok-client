import { notFound } from 'next/navigation';
import { CmsPage, cmsMetadata } from '@/components/content/CmsPage';

// Any page staff publish in Admin → Pages and FAQs (about, guide, the policies
// and any page they add). Fixed routes such as /faq take precedence over this one.

const SLUG = /^[a-z0-9-]{2,60}$/;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return SLUG.test(slug) ? cmsMetadata(slug) : {};
}

export default async function Page({ params }) {
  const { slug } = await params;
  if (!SLUG.test(slug)) notFound();
  return <CmsPage slug={slug} />;
}
