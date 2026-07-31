import { getBlogMetadata } from '@/lib/blog-metadata';

export const metadata = getBlogMetadata('operator');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
