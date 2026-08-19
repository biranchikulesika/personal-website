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

  const [posts, notes, books, media, adminProfile] = await Promise.all([
    contentService.getAllPosts(),
    contentService.getAllNotes(),
    contentService.getAllBooks(),
    contentService.getMedia(),
    contentService.getAdminProfile(),
  ]);

  return (
    <AdminDashboard
      initialPosts={posts}
      initialNotes={notes}
      initialBooks={books}
      initialMedia={media}
      initialProfile={adminProfile}
    />
  );
}
