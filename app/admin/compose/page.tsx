import type { Metadata } from 'next';
import { ContentService } from '@/lib/services/content.service';
import { ComposeWorkspace } from '@/components/admin/compose/compose-workspace';

export const metadata: Metadata = {
  title: 'MDX Composer | Biranchi Admin',
  description: 'Full-page IDE-grade MDX composer for essays and notes.',
  robots: {
    index: false,
    follow: false,
  },
};

interface ComposePageProps {
  searchParams: Promise<{
    slug?: string;
    type?: 'post' | 'note';
  }>;
}

export default async function ComposePage({ searchParams }: ComposePageProps) {
  const { slug, type } = await searchParams;
  const contentService = new ContentService();

  const mediaItems = await contentService.getMedia();
  const allPosts = await contentService.getAllPosts();
  const allNotes = await contentService.getAllNotes();

  let post = null;
  let note = null;

  if (slug) {
    if (type === 'note') {
      note = await contentService.getNote(slug);
    } else {
      post = await contentService.getPost(slug);
    }
  }

  return (
    <ComposeWorkspace
      initialDocument={{
        docType: type || (note ? 'note' : 'post'),
        slug,
        post: post || undefined,
        note: note || undefined,
      }}
      allPosts={allPosts}
      allNotes={allNotes}
      mediaItems={mediaItems}
    />
  );
}
