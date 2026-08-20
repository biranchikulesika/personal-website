import type { Metadata } from 'next';
import { ContentService } from '@/lib/services/content.service';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { getSupabaseServer } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Admin Workspace | Biranchi Kulesika',
  description: 'Manage writing, atomic notes, media resources, and admin settings.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const contentService = new ContentService();

  const [
    posts,
    notes,
    books,
    media,
    orphanedMedia,
    nowEntries,
    featuredPostSlugs,
    featuredBookSlugs,
  ] = await Promise.all([
    contentService.getAllPosts(),
    contentService.getAllNotes(),
    contentService.getAllBooks(),
    contentService.getMedia(),
    contentService.getOrphanedMedia(),
    contentService.getNowEntries(),
    contentService.getFeaturedPosts(),
    contentService.getFeaturedBooks(),
  ]);

  // Fetch user info from Supabase auth session
  let userName = 'Admin';
  let userEmail = '';
  let userAvatarUrl: string | null = null;
  let userRole: string = 'user';

  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      userName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split('@')[0]
        || 'Admin';
      userEmail = user.email || '';
      userAvatarUrl = user.user_metadata?.avatar_url
        || user.user_metadata?.picture
        || null;

      const role = await contentService.getUserRole(user.id);
      userRole = role || 'user';
    }
  } catch {
    // Auth not configured or no session
  }

  return (
    <AdminDashboard
      initialPosts={posts}
      initialNotes={notes}
      initialBooks={books}
      initialMedia={media}
      initialOrphanedMedia={orphanedMedia}
      initialNowEntries={nowEntries}
      initialFeaturedPostSlugs={featuredPostSlugs}
      initialFeaturedBookSlugs={featuredBookSlugs}
      authEnabled={process.env.AUTH_ENABLED === 'true'}
      userName={userName}
      userEmail={userEmail}
      userAvatarUrl={userAvatarUrl}
      userRole={userRole}
    />
  );
}
