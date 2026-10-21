import { NotFoundContent } from '@/components/content/NotFoundContent';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';

/** Unknown URLs (outside the site layout): render the site chrome around the message. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}
