export const revalidate = 3600;

import type { Metadata } from 'next';
import { SITE_URL, getCanonicalUrl } from '@/lib/config/seo';
import { getBooks } from '@/lib/queries';
import ReadingPageClient from '@/components/reading/ReadingPageClient';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Reading | Inside The Head",
  description: "Books that have shaped the way I think.",
  alternates: {
    canonical: getCanonicalUrl('/thinker/reading'),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ThinkerReadingPage() {
  const books = await getBooks();
  return <ReadingPageClient initialBooks={books} />;
}
