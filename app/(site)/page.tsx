import { HomeContent } from '@/components/home-content';
import { ContentService } from '@/lib/services/content.service';

export default async function Home() {
  const service = new ContentService();
  const [site, home] = await Promise.all([
    service.getSiteContent(),
    service.getHomeContent(),
  ]);
  return <HomeContent site={site} home={home} />;
}