import { Metadata } from 'next';
import { AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about the Wanderer persona.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  alternates: {
    canonical: getCanonicalUrl('/wanderer/about', 'wanderer'),
    languages: {
      en: getCanonicalUrl('/wanderer/about', 'wanderer'),
    },
  },
  openGraph: {
    url: getCanonicalUrl('/wanderer/about', 'wanderer'),
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
