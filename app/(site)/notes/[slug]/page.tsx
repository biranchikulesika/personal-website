import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NotePageView } from '@/components/note-page';
import { ContentService } from '@/lib/services/content.service';

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
  return {
    title: note ? note.title : 'Note not found',
    description: note?.description,
  };
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = await new ContentService().getNote(slug);
  if (!note) notFound();
  return <NotePageView note={note} />;
}
