import React from 'react';
import { BlogHomepage } from '@/components/blog/BlogHomepage';
import { getPostsMeta } from '@/lib/queries';

type Persona = 'main' | 'wanderer' | 'thinker' | 'builder' | 'operator';

async function createBlogPage(persona: Persona) {
  const posts = await getPostsMeta();
  return <BlogHomepage persona={persona} databasePosts={posts} />;
}

export async function BuilderBlogsPage() {
  return createBlogPage('builder');
}

export async function OperatorBlogsPage() {
  return createBlogPage('operator');
}

export async function ThinkerBlogsPage() {
  return createBlogPage('thinker');
}

export async function WandererBlogsPage() {
  return createBlogPage('wanderer');
}


