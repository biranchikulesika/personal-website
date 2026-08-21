import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogPostView } from '@/components/blog-post';
import { ContentService } from '@/lib/services/content.service';
import { postMetadata, articleJsonLd, breadcrumbJsonLd, safeJsonLd } from '@/lib/seo';

export async function generateStaticParams() {
  const posts = await new ContentService().getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await new ContentService().getPost(slug);
  if (!post) {
    return {};
  }
  return postMetadata(post);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await new ContentService().getPost(slug);
  if (!post) notFound();

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Scribble', url: '/scribble' },
    { name: post.title, url: `/p/${post.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd(post)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <BlogPostView post={post} />
    </>
  );
}
