import { getNewsletterMetadata } from '@/lib/newsletter-metadata';

export const metadata = getNewsletterMetadata('wanderer');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
