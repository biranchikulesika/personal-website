import { getNewsletterMetadata } from '@/lib/newsletter-metadata';

export const metadata = getNewsletterMetadata('operator');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
