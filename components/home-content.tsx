import type { BlogPost, BookItem, HomeContent, SiteContent } from '@/lib/types';
import { Hero } from './hero';
import { WritingSection } from './writing-section';
import { NotesSection } from './notes-section';
import { LibrarySection } from './library-section';
import { FeaturedSection } from './featured-section';

interface HomeContentProps {
  site: SiteContent;
  home: HomeContent;
  featuredPosts: BlogPost[];
  featuredBooks: BookItem[];
}

/**
 * Main homepage content area.
 * Hero, then featured items (if any), then writing/notes/library sections.
 */
export function HomeContent({ site, home, featuredPosts, featuredBooks }: HomeContentProps) {
  const hasFeatured = featuredPosts.length > 0 || featuredBooks.length > 0;

  return (
    <section aria-label="Homepage content">
      <div className="container-site py-10 md:py-14">
        <Hero hero={site.hero} />

        {hasFeatured && (
          <div className="mt-16 md:mt-24">
            <FeaturedSection posts={featuredPosts} books={featuredBooks} />
          </div>
        )}

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
