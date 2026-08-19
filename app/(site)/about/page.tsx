import type { Metadata } from 'next';
import { AboutPageView } from '@/components/about-page';
import { ContentService } from '@/lib/services/content.service';

export const metadata: Metadata = {
  title: 'About',
  description:
    'About Biranchi Kulesika — software developer, writer, and observer of digital life.',
};

export default async function AboutPage() {
  const service = new ContentService();
  const [site, writing] = await Promise.all([
    service.getSiteContent(),
    service.getWriting(),
  ]);

  return <AboutPageView site={site} featuredWriting={writing.items} />;
}