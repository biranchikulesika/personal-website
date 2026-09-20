import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ContentService } from '@/lib/services/content.service';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { getAuthService } from '@/lib/auth';
import { parseUserAgent } from '@/lib/utils';
import type { PasskeyItem, UserSession, SidepanelTab } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: 'Admin Workspace' },
  description: 'Manage writing, atomic notes, resources, and admin settings.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: initialTabParam } = await searchParams;
  // Only accept a known tab id: an unknown/missing value falls back to home.
  const initialTab: SidepanelTab = ["home", "content", "media", "subscribers", "account"].includes(
    initialTabParam as SidepanelTab,
  )
    ? (initialTabParam as SidepanelTab)
    : "home";

  const authService = getAuthService();
  let user;
  let userRole: string = 'user';

  try {
    const adminSession = await authService.requireAdmin();
    user = adminSession.user;
    userRole = adminSession.role;
  } catch {
    redirect('/admin/login?next=/admin');
  }

  const contentService = new ContentService();

  const userName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split('@')[0] ||
    'Admin';
  const userEmail = user.email || '';
  const userAvatarUrl =
    (user.user_metadata?.avatar_url as string) ||
    (user.user_metadata?.picture as string) ||
    (user.user_metadata?.avatar as string) ||
    '/biranchi.webp';

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
      initialTab={initialTab}
      userName={userName}
      userEmail={userEmail}
      userAvatarUrl={userAvatarUrl}
      userRole={userRole}
    />
  );
}
