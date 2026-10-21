import { notFound } from 'next/navigation';
import { getPublic } from '@/lib/api/server';
import { renderMarkdown } from '@/lib/markdown';
import { getTranslator } from '@/lib/preferences.server';

export async function loadPage(slug) {
  return (await getPublic(`/public/pages/${slug}`, { revalidate: 300 }))?.page ?? null;
}

/** Metadata for a CMS page, in the visitor's language. */
export async function cmsMetadata(slug) {
  const { lang } = await getTranslator();
  const page = await loadPage(slug);
  return page ? { title: page.title[lang] || page.title.en } : {};
}

/**
 * A page whose content staff edit in Admin → Pages and FAQs (about, guide, policies, …).
 * Falls back to English when the Bangla text is empty.
 */
export async function CmsPage({ slug }) {
  const { lang } = await getTranslator();
  const page = await loadPage(slug);
  if (!page) notFound();
  const title = page.title[lang] || page.title.en;
  const body = page.body[lang] || page.body.en;
  return (
    <article className="container-page max-w-3xl pb-24 pt-14">
      <div className="kicker mb-4">Ghotok</div>
      <h1 className="mb-8 font-display text-[clamp(34px,4.4vw,52px)] font-medium leading-title">{title}</h1>
      {/* renderMarkdown escapes all HTML in the source before formatting it. */}
      <div className="prose-cms" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
    </article>
  );
}
