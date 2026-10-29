import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NotePageView } from '@/components/note-page';
import { ContentService } from '@/lib/services/content.service';
import { noteMetadata, noteJsonLd, breadcrumbJsonLd, safeJsonLd } from '@/lib/seo';
import { getSupabaseUrl } from '@/lib/config/env';

export const dynamicParams = true;

export async function generateStaticParams() {
  const service = new ContentService();
  const slugs = await service.getNoteSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = await new ContentService().getNote(slug);
  if (!note || note.status === 'unpublished') {
    return {
      title: 'Note not found',
      robots: { index: false, follow: false },
    };
  }
  return noteMetadata(note);
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = await new ContentService().getNote(slug);
  if (!note || note.status === 'unpublished') notFound();

  const supabaseUrl = getSupabaseUrl();
  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Scribble', url: '/scribble' },
    { name: note.title, url: `/n/${note.slug}` },
  ]);

  const hasSupabaseMedia =
    (note.coverImage && note.coverImage.includes('supabase.co')) ||
    note.content.some((p) => p.includes('supabase.co'));

  return (
    <>
      {hasSupabaseMedia && supabaseUrl && (
        <>
          <link rel="preconnect" href={supabaseUrl} />
          <link rel="dns-prefetch" href={supabaseUrl} />
        </>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(noteJsonLd(note)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <NotePageView note={note} />
    </>
  );
}
