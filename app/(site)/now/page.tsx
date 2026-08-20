import type { Metadata } from 'next';
import { NowPageView } from '@/components/now-page';
import { ContentService } from '@/lib/services/content.service';

export const metadata: Metadata = {
  title: 'Now — Biranchi Kulesika',
  description:
    'A living snapshot of what currently has my focus — projects, reading, thinking, and daily rhythms.',
};

export const dynamic = 'force-dynamic';

export default async function NowPage() {
  const contentService = new ContentService();
  const entries = await contentService.getNowEntries();
  return <NowPageView entries={entries} />;
}