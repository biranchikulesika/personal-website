import type { Metadata } from 'next';
export { ThinkerArchivePage as default } from '@/components/blog/shared/PersonaBlogArchivePage';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return q?.trim() ? { robots: { index: false, follow: true } } : {};
}
