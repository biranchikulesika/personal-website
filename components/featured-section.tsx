import Link from 'next/link';
import type { BlogPost, BookItem } from '@/lib/types';
import { SectionHeading } from './section-heading';
import { formatDisplayDate } from '@/lib/utils';
import { EssayCover } from './ui/essay-cover';
import { BookCover } from './ui/book-cover';

interface FeaturedSectionProps {
  posts: BlogPost[];
  books: BookItem[];
}

function FeaturedPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="group h-full">
      <Link
        href={`/p/${post.slug}`}
        className="flex h-full flex-col justify-between rounded-2xl border border-accent/20 bg-post-card p-4 sm:p-5 shadow-xs transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-accent/40"
      >
        <div>
          <EssayCover title={post.title} coverImage={post.coverImage} />
          <h3 className="mt-4 font-serif text-lg font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
            {post.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-mid line-clamp-2">
            {post.description}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-tinted/15 pt-3 text-xs text-gray-mid">
          <span>{formatDisplayDate(post.publishedAt)}</span>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-tinted/20 px-2 py-0.5 text-[11px] text-gray-mid"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

function FeaturedBookCard({ book }: { book: BookItem }) {
  return (
    <article className="group relative">
      <Link href="/library" className="block">
        <BookCover title={book.title} cover={book.cover} />
        <span className="mt-3 block transition-transform duration-300 group-hover:translate-y-1">
          <p className="font-sans text-base font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
            {book.title}
          </p>
          <p className="mt-1 text-xs text-gray-mid">{book.author}</p>
        </span>
      </Link>
    </article>
  );
}

export function FeaturedSection({ posts, books }: FeaturedSectionProps) {
  return (
    <section aria-labelledby="home-featured-heading">
      <SectionHeading
        id="home-featured-heading"
        title="Featured"
        subheader="Hand-picked writing and reading"
      />

      {/* Featured Posts */}
      {posts.length > 0 && (
        <div className="mt-6">
          <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6">
            {posts.map((post) => (
              <FeaturedPostCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:hidden">
            {posts.map((post) => (
              <div key={post.slug} className="w-[82%] shrink-0 snap-start">
                <FeaturedPostCard post={post} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Books */}
      {books.length > 0 && (
        <div className="mt-10">
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 sm:gap-6">
            {books.map((book) => (
              <FeaturedBookCard key={book.slug} book={book} />
            ))}
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:hidden">
            {books.map((book) => (
              <article
                key={book.slug}
                className="group relative w-[42%] shrink-0 snap-start"
              >
                <Link href="/library" className="block">
                  <BookCover title={book.title} cover={book.cover} />
                  <span className="mt-3 block">
                    <p className="font-sans text-sm font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
                      {book.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-mid">{book.author}</p>
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
