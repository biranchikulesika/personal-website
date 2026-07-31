import React from 'react';
import { ArchivePage } from '@/components/blog/ArchivePage';
import { getPostsMeta } from '@/lib/queries';

type Persona = 'main' | 'wanderer' | 'thinker' | 'builder' | 'operator';

async function createArchivePage(persona: Persona, searchParams: { q?: string }) {
  const q = searchParams?.q || '';
  const posts = await getPostsMeta(q);
  return <ArchivePage persona={persona} databasePosts={posts} initialSearchQuery={q} />;
}

export async function BuilderArchivePage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  return createArchivePage('builder', searchParams);
}

export async function OperatorArchivePage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  return createArchivePage('operator', searchParams);
}

export async function ThinkerArchivePage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  return createArchivePage('thinker', searchParams);
}

export async function WandererArchivePage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  return createArchivePage('wanderer', searchParams);
}


