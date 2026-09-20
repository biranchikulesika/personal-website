import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthService } from '@/lib/auth';
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
    const authService = getAuthService();
    const adminSession = await authService.requireAdmin();
    if (adminSession) {
      redirect('/admin');
    }
  } catch (err: unknown) {
    // Re-throw redirect exceptions so Next.js can execute the redirect
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    // Continue to login form if not authenticated or not admin
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
