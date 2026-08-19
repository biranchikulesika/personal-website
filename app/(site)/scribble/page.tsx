import type { Metadata } from 'next';
import { ScribblePage } from '@/components/scribble-page';
import { ContentService } from '@/lib/services/content.service';

export const metadata: Metadata = {
  title: 'Scribble — Biranchi Kulesika',
  description:
    'Essays, notes, and reading — writing and thinking, tended in the open.',
};

export default async function ScribbleRoute() {
  const entries = await new ContentService().getScribbleEntries();

  return <ScribblePage entries={entries} />;
}