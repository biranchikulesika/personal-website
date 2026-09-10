import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ContentService } from '@/lib/services/content.service';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/auth/admin';
import { ComposeWorkspace } from './compose-workspace-loader';

export const metadata: Metadata = {
  title: { absolute: 'Compose' },
  description: 'Full-page IDE-grade MDX composer for essays, notes, and Now entries.',
  robots: {
    index: false,
    follow: false,
  },
};

interface ComposePageProps {
  searchParams: Promise<{
    slug?: string;
    type?: 'post' | 'note' | 'now';
  }>;
}

export default async function ComposePage({ searchParams }: ComposePageProps) {
  let user = null;
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    user = null;
  }

  if (!user) {
    redirect('/admin/login?next=/admin/compose');
  }

  // Defense in depth: only admin roles may use the composer.
  const role = await new ContentService().getUserRole(user.id);
  if (!isAdminRole(role)) {
    redirect('/admin/login?error=forbidden');
  }

  const { slug, type } = await searchParams;
  const contentService = new ContentService();

  const mediaItems = await contentService.getMedia();
  const allPosts = await contentService.getAllPosts();
  const allNotes = await contentService.getAllNotes();
  const allNow = await contentService.getNowEntries();
  const allBooks = await contentService.getAllBooks();

  let post = null;
  let note = null;
  let now = null;

  if (slug) {
    if (type === 'note') {
      note = await contentService.getNote(slug);
    } else if (type === 'now') {
      now = allNow.find((e) => e.id === slug) || null;
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
        now: now || undefined,
      }}
      allPosts={allPosts}
      allNotes={allNotes}
      allNow={allNow}
      allBooks={allBooks}
      mediaItems={mediaItems}
    />
  );
}