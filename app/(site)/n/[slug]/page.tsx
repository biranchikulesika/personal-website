import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NotePageView } from '@/components/note-page';
import { ContentService } from '@/lib/services/content.service';
import { noteMetadata, noteJsonLd, breadcrumbJsonLd, safeJsonLd } from '@/lib/seo';

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

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Scribble', url: '/scribble' },
    { name: note.title, url: `/n/${note.slug}` },
  ]);

  return (
    <>
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
