import type { Metadata } from 'next';
import { AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  title: "About | Biranchi Kulesika",
  description: "Learn more about Biranchi Kulesika and the four corners of this website.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  alternates: {
    canonical: getCanonicalUrl('/about'),
    languages: {
      en: getCanonicalUrl('/about'),
    },
  },
  openGraph: {
    url: getCanonicalUrl('/about'),
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    creator: AUTHOR.twitter,
    site: AUTHOR.twitter,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
