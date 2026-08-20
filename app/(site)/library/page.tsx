import type { Metadata } from 'next';
import { LibraryPageView } from '@/components/library-page';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Library',
  description:
    'Books that have shaped thinking — read, on the shelf, or somewhere in between.',
  alternates: { canonical: `${SITE_URL}/library` },
};

export default async function LibraryPage() {
  const library = await new ContentService().getLibrary();

  return (
    <LibraryPageView
      books={library.items}
      title={library.title}
      subheader={library.subheader}
    />
  );
}