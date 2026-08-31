import Link from 'next/link';
import type { BlogPost, SectionGroup, WritingItem } from '@/lib/types';
import { SectionHeading } from './section-heading';
import { formatDisplayDate } from '@/lib/utils';
import { EssayCover } from './ui/essay-cover';

interface WritingSectionProps {
  writing: SectionGroup<WritingItem>;
  limit?: number;
  featured?: BlogPost[];
}

function EssayCard({ item, priority = false }: { item: WritingItem; priority?: boolean }) {
  return (
    <article className="group h-full">
      <Link
        href={`/p/${item.slug}`}
        className="flex h-full flex-col justify-between rounded-2xl border border-tinted/20 bg-post-card p-4 sm:p-5 shadow-xs transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
      >
        <div>
          <EssayCover title={item.title} coverImage={item.coverImage} priority={priority} />
          <h3 className="mt-4 font-serif text-lg font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-mid line-clamp-2">
            {item.description}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-tinted/15 pt-3 text-xs text-gray-mid">
          <span>{formatDisplayDate(item.date)}</span>
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {item.tags.map((tag) => (
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

export function WritingSection({ writing, limit = 4, featured }: WritingSectionProps) {
  const items = featured && featured.length > 0
    ? featured.slice(0, limit).map((post) => ({
        id: post.slug,
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.publishedAt,
        persona: post.persona ?? 'builder',
        tags: post.tags,
        coverImage: post.coverImage,
      }))
    : limit
      ? writing.items.slice(0, limit)
      : writing.items;

  return (
    <section aria-labelledby="home-writing-heading">
      <SectionHeading
        id="home-writing-heading"
        title={writing.title}
        subheader={writing.subheader}
      />

      {/* Desktop Mode: 2 by 2 Grid */}
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6">
        {items.map((item, index) => (
          <EssayCard key={item.slug} item={item} priority={index < 2} />
        ))}
      </div>

      {/* Mobile Mode: Sideways Scroll */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:hidden">
        {items.map((item, index) => (
          <div key={item.slug} className="w-[82%] shrink-0 snap-start">
            <EssayCard item={item} priority={index < 1} />
          </div>
        ))}
      </div>
    </section>
  );
}