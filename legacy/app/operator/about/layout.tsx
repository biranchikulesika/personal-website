import { Metadata } from 'next';
import { AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about the Operator corner of this website.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  alternates: {
    canonical: getCanonicalUrl('/operator/about', 'operator'),
    languages: {
      en: getCanonicalUrl('/operator/about', 'operator'),
    },
  },
  openGraph: {
    url: getCanonicalUrl('/operator/about', 'operator'),
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
