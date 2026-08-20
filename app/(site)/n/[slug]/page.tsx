import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NotePageView } from '@/components/note-page';
import { ContentService } from '@/lib/services/content.service';
import { noteMetadata } from '@/lib/seo';

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
  if (!note) return { title: 'Note not found' };
  return noteMetadata(note);
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
