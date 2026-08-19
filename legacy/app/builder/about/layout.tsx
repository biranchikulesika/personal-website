import { Metadata } from 'next';
import { AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about the Builder corner of this website.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  alternates: {
    canonical: getCanonicalUrl('/builder/about', 'builder'),
    languages: {
      en: getCanonicalUrl('/builder/about', 'builder'),
    },
  },
  openGraph: {
    url: getCanonicalUrl('/builder/about', 'builder'),
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
