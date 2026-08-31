import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ContentService } from '@/lib/services/content.service';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { getSupabaseServer } from '@/lib/supabase/server';
import { parseUserAgent } from '@/lib/utils';
import type { PasskeyItem, UserSession } from '@/lib/types';

export const metadata: Metadata = {
  title: { absolute: 'Admin Workspace' },
  description: 'Manage writing, atomic notes, media resources, and admin settings.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const contentService = new ContentService();

  // Verify authentication session
  let user = null;
  let userName = 'Admin';
  let userEmail = '';
  let userAvatarUrl: string | null = null;
  let userRole: string = 'user';

  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      userName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Admin';
      userEmail = user.email || '';
      userAvatarUrl =
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        user.user_metadata?.avatar ||
        user.identities?.[0]?.identity_data?.avatar_url ||
        user.identities?.[0]?.identity_data?.picture ||
        '/biranchi.webp';

      const role = await contentService.getUserRole(user.id);
      userRole = role || 'user';
    }
  } catch {
    // Auth client unavailable
    user = null;
  }

  if (!user) {
    redirect('/admin/login?next=/admin');
  }

  // Parse current request headers for session tracking
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const parsedUA = parseUserAgent(userAgent);
  const clientIp =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    '127.0.0.1';
  const locationLabel =
    clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost'
      ? `${clientIp} (Local)`
      : clientIp;

  // Record/ensure current active session
  const currentSession: UserSession = {
    id: 'sess-current',
    userId: user.id,
    device: parsedUA.label,
    location: locationLabel,
    ipAddress: clientIp,
    startedAt: 'Just now',
    lastActiveAt: new Date().toISOString(),
    isCurrent: true,
  };
  await contentService.recordSession(currentSession);

  // Determine connected providers from Supabase identities or service
  let connectedProviders: string[] = ['google'];
  if (user.identities && user.identities.length > 0) {
    connectedProviders = user.identities.map(
      (id: { provider: string }) => id.provider,
    );
  } else {
    connectedProviders = await contentService.getConnectedProviders(user.id);
  }

  const [
    posts,
    notes,
    books,
    media,
    orphanedMedia,
    nowEntries,
    passkeys,
    sessions,
    subscribers,
  ] = await Promise.all([
    contentService.getAllPosts(),
    contentService.getAllNotes(),
    contentService.getAllBooks(),
    contentService.getMedia(),
    contentService.getOrphanedMedia(),
    contentService.getNowEntries(),
    contentService.getPasskeys(user.id),
    contentService.getSessions(user.id, 'sess-current'),
    contentService.getSubscribers(),
  ]);

  return (
    <AdminDashboard
      initialPosts={posts}
      initialNotes={notes}
      initialBooks={books}
      initialMedia={media}
      initialOrphanedMedia={orphanedMedia}
      initialNowEntries={nowEntries}
      initialSubscribers={subscribers}
      initialPasskeys={passkeys}
      initialConnectedProviders={connectedProviders}
      initialSessions={sessions}
      userName={userName}
      userEmail={userEmail}
      userAvatarUrl={userAvatarUrl}
      userRole={userRole}
    />
  );
}
