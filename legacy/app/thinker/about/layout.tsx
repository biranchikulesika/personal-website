import { Metadata } from 'next';
import { AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about the Thinker persona.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  alternates: {
    canonical: getCanonicalUrl('/thinker/about', 'thinker'),
    languages: {
      en: getCanonicalUrl('/thinker/about', 'thinker'),
    },
  },
  openGraph: {
    url: getCanonicalUrl('/thinker/about', 'thinker'),
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    creator: AUTHOR.twitter,
    site: AUTHOR.twitter,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
