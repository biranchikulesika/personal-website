import type { Metadata } from 'next';
import { SITE_URL, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Fund | Biranchi Kulesika",
  description: "Support this work and view redistribution records.",
  alternates: {
    canonical: getCanonicalUrl('/fund'),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
