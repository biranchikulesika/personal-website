import type { Metadata } from 'next';
import { NowPageView } from '@/components/now-page';

export const metadata: Metadata = {
  title: 'Now — Biranchi Kulesika',
  description:
    'A living snapshot of what currently has my focus — projects, reading, thinking, and daily rhythms.',
};

export default function NowPage() {
  return <NowPageView />;
}