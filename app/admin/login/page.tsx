import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ContentService } from '@/lib/services/content.service';
import { isAdminRole } from '@/lib/auth/admin';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: { absolute: 'Admin Sign In' },
  description: 'Sign in to the administrative workspace.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Only users with an admin role may enter the admin panel; everyone else
    // (even authenticated) stays on the login screen.
    if (user) {
      const role = await new ContentService().getUserRole(user.id);
      if (isAdminRole(role)) {
        redirect('/admin');
      }
    }
  } catch (err: unknown) {
    // Re-throw redirect exceptions so Next.js can execute the redirect
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    // Continue to login form if client unconfigured
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-night">
          <p className="text-sm text-ink-soft">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
