import type { Metadata } from 'next';
import { getPostsMeta, getPostBySlug } from '@/lib/queries';
import PostPageClient from './PostPageClient';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { AUTHOR, getCanonicalUrl, getPostOgImage, getDynamicPostOgUrl } from '@/lib/config/seo';
import dynamic from 'next/dynamic';
import { ArticleJsonLd } from '@/components/seo/JsonLd';

// Lazy-load the heavy ArticleJsonLd component — only rendered once, no need to be eager
const ArticleJsonLdLazy = dynamic(() => 
  import('@/components/seo/JsonLd').then(mod => ({ default: mod.ArticleJsonLd })),
  { ssr: true }
);

export const revalidate = 3600; // ISR: revalidate every hour

// Cache the post fetch to deduplicate across metadata and page
const getCachedPost = cache(async (slug: string) => {
  return getPostBySlug(slug);
});

const getCachedPostsMeta = cache(async () => {
  return getPostsMeta();
});

export async function generateStaticParams() {
  const posts = await getPostsMeta();
  const publishedPosts = posts.filter((p: any) => p.status !== 'draft' && (!p.status || p.status.toLowerCase() !== 'draft') && p.hidden !== true);
  return publishedPosts.map((post) => ({
    slug: post.slug || post.id,
  }));
}

export async function generateMetadata({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ preview?: string }>
}): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const isPreview = resolvedSearch?.preview === 'true';

  const post = await getCachedPost(resolvedParams.slug);

  if (!post || (!isPreview && (post.status === 'draft' || (post.status && post.status.toLowerCase() === 'draft') || post.hidden === true))) {
    notFound();
  }

  // Generate OG image: use cover image if available, otherwise use dynamic OG generator
  const ogImage = post.coverImageUrl
    ? getPostOgImage(post)
    : getDynamicPostOgUrl(post.title, post.excerpt, post.persona);
  const canonicalUrl = getCanonicalUrl(`/p/${resolvedParams.slug}`);

  const seoTitle = post.seoTitle || post.title;
  const seoDescription = post.seoDescription || post.excerpt || post.title;
  const ogTitle = post.ogTitle || seoTitle;
  const ogDescription = post.ogDescription || seoDescription;
  const twitterTitle = post.twitterTitle || seoTitle;
  const twitterDescription = post.twitterDescription || seoDescription;
  const keywords = Array.isArray(post.keywords) && post.keywords.length > 0
    ? post.keywords
    : (Array.isArray(post.tags) ? post.tags : []);

  return {
    title: `${seoTitle} | Biranchi Kulesika`,
    description: seoDescription,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
    // Preview URLs (?preview=true) render draft/unpublished content and must
    // never appear in search results — noindex them while keeping canonical.
    robots: isPreview
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      url: canonicalUrl,
      images: [ogImage],
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt || post.publishedAt || post.createdAt,
      authors: [AUTHOR.name],
      tags: post.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: twitterDescription,
      images: [ogImage],
      creator: AUTHOR.twitter,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: canonicalUrl,
      },
    },
  };
}

export default async function Page({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams?: Promise<{ persona?: string, preview?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const isPreview = resolvedSearch?.preview === 'true';
  
  // Persona is passed via searchParams from middleware (for subdomain requests)
  // or from direct query params. No headers() needed → keeps the page statically cacheable.
  const detectedPersona = resolvedSearch?.persona || 'main';
  
  // Parallel fetch: post content and posts metadata are independent
  // Use getCachedPost (wrapped in React.cache()) to deduplicate with generateMetadata
  const [post, posts] = await Promise.all([
    getCachedPost(resolvedParams.slug),
    getCachedPostsMeta(),
  ]);

  // For a missing post, or draft/hidden (unless preview), render a real 404 —
  // not a soft-404 page that returns HTTP 200.
  if (!post || (!isPreview && (post.status === 'draft' || (post.status && post.status.toLowerCase() === 'draft') || post.hidden === true))) {
    notFound();
  }

  const finalPost = post;

  // Compile MDX content for rich rendering with JSX components
  // (<Image>, <Callout>, <YouTube>, etc.). If compilation fails (e.g. the
  // content is plain HTML or the MDX parser chokes), we gracefully fall
  // back to the raw content rendering path in PostRenderer.
  let compiledMdx: any = undefined;
  if (finalPost?.content && typeof finalPost.content === 'string') {
    try {
      const { compileMDX } = await import('@/lib/mdx/compile');
      compiledMdx = await compileMDX(finalPost.content);
    } catch (e) {
      console.error('Failed to compile MDX for post', finalPost.slug, e);
    }
  }

  // Filter and deduplicate published posts
  const publishedPosts = posts.filter((p: any) => 
    p.status !== 'draft' && 
    (!p.status || p.status.toLowerCase() !== 'draft') && 
    p.hidden !== true
  );
  
  const canonicalUrl = getCanonicalUrl(`/p/${resolvedParams.slug}`);

  return (
    <>
      {finalPost && <ArticleJsonLdLazy post={finalPost} url={canonicalUrl} />}
      <PostPageClient 
        post={finalPost} 
        slug={resolvedParams.slug} 
        allPosts={publishedPosts} 
        fallbackPersona={detectedPersona} 
        compiledMdx={compiledMdx}
      />
    </>
  );
}

