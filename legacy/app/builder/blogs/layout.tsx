import { getBlogMetadata } from '@/lib/blog-metadata';

export const metadata = getBlogMetadata('builder');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
