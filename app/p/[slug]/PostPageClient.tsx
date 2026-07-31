'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Lazy-load PostRenderer — it's a large client component only needed when viewing a post
const PostRenderer = dynamic(() => import('@/components/post-renderer/PostRenderer'), {
  ssr: true,
  loading: () => (
    <div className="animate-pulse space-y-6 p-6 max-w-3xl mx-auto">
      <div className="h-4 bg-muted rounded w-1/4" />
      <div className="h-8 bg-muted rounded w-3/4" />
      <div className="h-6 bg-muted rounded w-1/2" />
      <div className="space-y-3 pt-4">
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-4/5" />
      </div>
    </div>
  )
});

interface PostPageClientProps {
  post: any | undefined;
  slug: string;
  allPosts: any[];
  fallbackPersona?: string;
  compiledMdx?: any;
}

export default function PostPageClient({ post, slug, allPosts, fallbackPersona, compiledMdx }: PostPageClientProps) {
  return <PostRenderer post={post} slug={slug} allPosts={allPosts} fallbackPersona={fallbackPersona} compiledMdx={compiledMdx} />;
}
