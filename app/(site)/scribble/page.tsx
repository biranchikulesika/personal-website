import type { Metadata } from 'next';
import { ScribblePage } from '@/components/scribble-page';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL } from '@/lib/constants';
import { breadcrumbJsonLd, safeJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Scribble',
  description:
    'Essays, notes, and reading — writing and thinking, tended in the open.',
  alternates: { canonical: `${SITE_URL}/scribble` },
  openGraph: {
    title: 'Scribble | Biranchi Kulesika',
    description:
      'Essays, notes, and reading — writing and thinking, tended in the open.',
    url: `${SITE_URL}/scribble`,
    siteName: 'Biranchi Kulesika',
    images: [{ url: `${SITE_URL}/api/og?title=Scribble&type=scribble`, width: 1200, height: 630, alt: 'Scribble' }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@BKulesika',
    title: 'Scribble | Biranchi Kulesika',
    description:
      'Essays, notes, and reading — writing and thinking, tended in the open.',
  },
};

export default async function ScribbleRoute() {
  const entries = await new ContentService().getScribbleEntries();

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Scribble', url: '/scribble' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <ScribblePage entries={entries} />
    </>
  );
}