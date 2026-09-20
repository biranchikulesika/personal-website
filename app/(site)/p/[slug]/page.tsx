import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogPostView } from '@/components/blog-post';
import { ContentService } from '@/lib/services/content.service';
import { postMetadata, articleJsonLd, breadcrumbJsonLd, safeJsonLd } from '@/lib/seo';

export const dynamicParams = true;

export async function generateStaticParams() {
  const service = new ContentService();
  const slugs = await service.getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await new ContentService().getPost(slug);
  if (!post || post.status === 'unpublished') {
    return {
      title: 'Post not found',
      robots: { index: false, follow: false },
    };
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
  if (!post || post.status === 'unpublished') notFound();

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Scribble', url: '/scribble' },
    { name: post.title, url: `/p/${post.slug}` },
  ]);

  const hasSupabaseMedia =
    (post.coverImage && post.coverImage.includes('supabase.co')) ||
    post.intro.some((p) => p.includes('supabase.co')) ||
    post.sections.some(
      (s) =>
        (s.figure?.src && s.figure.src.includes('supabase.co')) ||
        s.paragraphs.some((p) => p.includes('supabase.co')),
    );

  return (
    <>
      {hasSupabaseMedia && (
        <>
          <link
            rel="preconnect"
            href="https://ojzxdgzkrjmfeqyxvfud.supabase.co"
          />
          <link
            rel="dns-prefetch"
            href="https://ojzxdgzkrjmfeqyxvfud.supabase.co"
          />
        </>
      )}
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
