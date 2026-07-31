'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  
  // Need to handle cases where we might be outside the App Router provider in standalone tests,
  // but it's safe to assume this will run in Next.js environment.
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  const supabase = createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        experimental: {
          passkey: true,
        },
      },
    }
  );

  useEffect(() => {
    const checkSessionExpiry = async (session: any) => {
      if (session && session.user?.last_sign_in_at) {
        const lastSignIn = new Date(session.user.last_sign_in_at).getTime();
        const now = Date.now();
        const hours24 = 24 * 60 * 60 * 1000;
        
        if (now - lastSignIn > hours24) {
          await supabase.auth.signOut();
          router.push('/admin/login');
          return true; // Expired
        }
      }
      return false; // Not expired
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const isExpired = await checkSessionExpiry(session);
        if (isExpired) return;
      }
      
      if (!session && pathname !== '/admin/login' && !pathname.startsWith('/admin/auth/callback')) {
        router.push('/admin/login');
      } else {
        setAuthed(true);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const isExpired = await checkSessionExpiry(session);
        if (isExpired) return;
      }

      if (!session && pathname !== '/admin/login' && !pathname.startsWith('/admin/auth/callback')) {
        router.push('/admin/login');
      } else if (session) {
        setAuthed(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, supabase.auth]);

  const isPublicRoute = pathname === '/admin/login' || (pathname?.startsWith('/admin/auth/callback') ?? false);

  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" aria-label="Loading">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse rounded-full h-8 w-8 bg-primary/10" />
          <span className="text-xs font-mono text-primary/40 tracking-wider">Loading</span>
        </div>
      </div>
    );
  }

  // If not authed and not on a public route, wait for the redirect
  if (!authed && !isPublicRoute) {
    return null; 
  }

  return (
    <>
      {children}
    </>
  );
}
