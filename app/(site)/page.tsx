import type { Metadata } from 'next';
import { HomeContent } from '@/components/home-content';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: `${SITE_URL}/api/og?title=${encodeURIComponent(SITE_NAME)}&type=home`, width: 1200, height: 630, alt: SITE_NAME }],
  },
};

export default async function Home() {
  const service = new ContentService();
  const [site, home] = await Promise.all([
    service.getSiteContent(),
    service.getHomeContent(),
  ]);
  return <HomeContent site={site} home={home} />;
}