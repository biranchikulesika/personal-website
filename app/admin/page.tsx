import type { Metadata } from 'next';
import { ContentService } from '@/lib/services/content.service';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

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
    adminProfile,
    nowEntries,
  ] = await Promise.all([
    contentService.getAllPosts(),
    contentService.getAllNotes(),
    contentService.getAllBooks(),
    contentService.getMedia(),
    contentService.getOrphanedMedia(),
    contentService.getAdminProfile(),
    contentService.getNowEntries(),
  ]);

  return (
    <AdminDashboard
      initialPosts={posts}
      initialNotes={notes}
      initialBooks={books}
      initialMedia={media}
      initialOrphanedMedia={orphanedMedia}
      initialProfile={adminProfile}
      initialNowEntries={nowEntries}
    />
  );
}
