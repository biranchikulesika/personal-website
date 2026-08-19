import type { HomeContent, SiteContent } from '@/lib/types';
import { Hero } from './hero';
import { WritingSection } from './writing-section';
import { NotesSection } from './notes-section';
import { LibrarySection } from './library-section';

interface HomeContentProps {
  site: SiteContent;
  home: HomeContent;
}

/**
 * Main homepage content area.
 * Hero (Kadlac-inspired two-column layout), then a wide essay column beside
 * a narrower notes sidebar, with the library below.
 */
export function HomeContent({ site, home }: HomeContentProps) {
  return (
    <section aria-label="Homepage content">
      <div className="container-site py-10 md:py-14">
        <Hero hero={site.hero} />

        <div className="mt-16 grid grid-cols-1 gap-16 md:mt-24 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <WritingSection writing={home.writing} limit={4} />
          </div>
          <div className="lg:col-span-4">
            <NotesSection notes={home.notes} />
          </div>
        </div>

        <div className="mt-16 md:mt-24">
          <LibrarySection library={home.library} limit={4} />
        </div>
      </div>
    </section>
  );
}