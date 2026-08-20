import Link from 'next/link';
import type { SectionGroup, WritingItem } from '@/lib/types';
import { SectionHeading } from './section-heading';
import { formatDisplayDate } from '@/lib/utils';
import { EssayCover } from './ui/essay-cover';

interface WritingSectionProps {
  writing: SectionGroup<WritingItem>;
  limit?: number;
}

function EssayCard({ item }: { item: WritingItem }) {
  return (
    <article className="group h-full">
      <Link
        href={`/p/${item.slug}`}
        className="flex h-full flex-col justify-between rounded-2xl border border-tinted/20 bg-post-card p-4 sm:p-5 shadow-xs transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
      >
        <div>
          <EssayCover title={item.title} coverImage={item.coverImage} />
          <h4 className="mt-4 font-serif text-lg font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
            {item.title}
          </h4>
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

export function WritingSection({ writing, limit = 4 }: WritingSectionProps) {
  const items = limit ? writing.items.slice(0, limit) : writing.items;

  return (
    <section aria-labelledby="home-writing-heading">
      <SectionHeading
        id="home-writing-heading"
        title={writing.title}
        subheader={writing.subheader}
      />

      {/* Desktop Mode: 2 by 2 Grid */}
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6">
        {items.map((item) => (
          <EssayCard key={item.slug} item={item} />
        ))}
      </div>

      {/* Mobile Mode: Sideways Scroll */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:hidden">
        {items.map((item) => (
          <div key={item.slug} className="w-[82%] shrink-0 snap-start">
            <EssayCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}