import type { Metadata } from 'next';
import { ScribblePage } from '@/components/scribble-page';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Scribble',
  description:
    'Essays, notes, and reading — writing and thinking, tended in the open.',
  alternates: { canonical: `${SITE_URL}/scribble` },
};

export default async function ScribbleRoute() {
  const entries = await new ContentService().getScribbleEntries();

  return <ScribblePage entries={entries} />;
}