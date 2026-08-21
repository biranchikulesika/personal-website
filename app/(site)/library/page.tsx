import type { Metadata } from 'next';
import { LibraryPageView } from '@/components/library-page';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL } from '@/lib/constants';
import { breadcrumbJsonLd, safeJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Library',
  description:
    'Books that have shaped thinking — read, on the shelf, or somewhere in between.',
  alternates: { canonical: `${SITE_URL}/library` },
  openGraph: {
    title: 'Library | Biranchi Kulesika',
    description:
      'Books that have shaped thinking — read, on the shelf, or somewhere in between.',
    url: `${SITE_URL}/library`,
    siteName: 'Biranchi Kulesika',
    images: [{ url: `${SITE_URL}/api/og?title=Library&type=library`, width: 1200, height: 630, alt: 'Library' }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@BKulesika',
    title: 'Library | Biranchi Kulesika',
    description:
      'Books that have shaped thinking — read, on the shelf, or somewhere in between.',
  },
};

export default async function LibraryPage() {
  const library = await new ContentService().getLibrary();

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Library', url: '/library' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <LibraryPageView
        books={library.items}
        title={library.title}
        subheader={library.subheader}
      />
    </>
  );
}