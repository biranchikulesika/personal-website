import type { Metadata } from 'next';
import { HomeContent } from '@/components/home-content';
import { ContentService } from '@/lib/services/content.service';
import { SITE_CONFIG } from '@/lib/config/site';
import { homeMetadata } from '@/lib/seo';

export const metadata: Metadata = homeMetadata();

export default async function Home() {
  const site = SITE_CONFIG;
  const service = new ContentService();
  const [home, featuredPostSlugs, featuredBookSlugs, allBooks] = await Promise.all([
    service.getHomeContent(),
    service.getFeaturedPosts(),
    service.getFeaturedBooks(),
    service.getAllBooks(),
  ]);

  const postResults = await Promise.all(
    featuredPostSlugs.map((slug) => service.getPost(slug)),
  );

  const featuredPosts = postResults.filter(
    (p): p is NonNullable<typeof p> => p !== null && p.status !== 'unpublished',
  );
  const featuredBookSet = new Set(featuredBookSlugs);
  const featuredBooks = allBooks.filter((b) => featuredBookSet.has(b.slug));

  return (
    <HomeContent
      site={site}
      home={home}
      featuredPosts={featuredPosts}
      featuredBooks={featuredBooks}
    />
  );
}
