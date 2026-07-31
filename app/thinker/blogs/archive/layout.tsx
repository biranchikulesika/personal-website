import { getArchiveMetadata } from '@/lib/blog-metadata';

export const metadata = getArchiveMetadata('thinker');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
