import React from 'react';
import type { Metadata } from 'next';
import { SITE_URL, getCanonicalUrl } from '@/lib/config/seo';
import { ArchivePage } from '@/components/blog/ArchivePage';
import { getPostsMeta } from '@/lib/queries';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const isSearch = Boolean(q?.trim());

  return {
    metadataBase: new URL(SITE_URL),
    title: 'Archive | Biranchi Kulesika',
    description: 'Explore older posts and past writings.',
    alternates: {
      canonical: getCanonicalUrl('/blogs/archive'),
    },
    // ?q= renders search results inside the archive — a parameterized,
    // effectively-unbounded URL space. Keep the clean archive page indexable,
    // noindex the search variants, canonical always points at /blogs/archive.
    robots: isSearch
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function MainArchivePage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  const posts = await getPostsMeta(q);
  return <ArchivePage persona="main" databasePosts={posts} initialSearchQuery={q} />;
}
