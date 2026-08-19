import { getBlogMetadata } from '@/lib/blog-metadata';

export const metadata = getBlogMetadata('thinker');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
