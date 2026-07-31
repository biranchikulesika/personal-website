import type { Metadata } from 'next';
import { SITE_URL, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Newsletter | Biranchi Kulesika",
  description: "Subscribe to occasional updates on building, thinking, and wandering.",
  alternates: {
    canonical: getCanonicalUrl('/newsletter'),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function NewsletterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
