import React from 'react';
import { BlogHomepage } from '@/components/blog/BlogHomepage';
import { getPostsMeta } from '@/lib/queries';
import { CollectionPageJsonLd } from '@/components/seo/JsonLd';
import { getCanonicalUrl } from '@/lib/config/seo';

export const revalidate = 3600; // Revalidate every hour

export default async function MainBlogsPage() {
  const posts = await getPostsMeta();
  return (
    <>
      <CollectionPageJsonLd
        name="Blogs"
        description="Writing about technology, cybersecurity, philosophy, and life."
        url={getCanonicalUrl('/blogs')}
      />
      <BlogHomepage persona="main" databasePosts={posts} />
    </>
  );
}
