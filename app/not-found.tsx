import type { Metadata } from 'next';
import { NotFoundView } from '@/components/not-found-view';

export const metadata: Metadata = {
  title: { absolute: 'Page Not Found' },
  description: 'The page you are looking for does not exist or has been moved.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function GlobalNotFound() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-night text-paper">
      <NotFoundView />
    </main>
  );
}
