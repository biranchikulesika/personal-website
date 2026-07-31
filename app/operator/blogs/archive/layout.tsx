import { getArchiveMetadata } from '@/lib/blog-metadata';

export const metadata = getArchiveMetadata('operator');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
