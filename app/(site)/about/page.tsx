import type { Metadata } from 'next';
import { AboutPageView } from '@/components/about-page';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
  description:
    'About Biranchi Kulesika — software developer, writer, and observer of digital life.',
  alternates: { canonical: `${SITE_URL}/about` },
};

export default async function AboutPage() {
  const service = new ContentService();
  const [site, writing] = await Promise.all([
    service.getSiteContent(),
    service.getWriting(),
  ]);

  return <AboutPageView site={site} featuredWriting={writing.items} />;
}