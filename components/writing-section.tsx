import Link from 'next/link';
import type { SectionGroup, WritingItem } from '@/lib/types';
import { SectionHeading } from './section-heading';

interface WritingSectionProps {
  writing: SectionGroup<WritingItem>;
  limit?: number;
}

/**
 * Placeholder cover for essay listing cards. A neutral letter composition
 * until real images exist — no fabricated imagery or assets.
 */
function EssayCover({ title }: { title: string }) {
  return (
    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-cream">
      <span className="font-serif text-6xl italic text-ink-soft/40">
        {title.charAt(0)}
      </span>
    </div>
  );
}

export function WritingSection({ writing, limit }: WritingSectionProps) {
  const items = limit ? writing.items.slice(0, limit) : writing.items;

  return (
    <section aria-labelledby="home-writing-heading">
      <SectionHeading
        id="home-writing-heading"
        title={writing.title}
        subheader={writing.subheader}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.slug} className="group">
            <Link
              href={`/writing/${item.slug}`}
              className="block rounded-lg border border-tinted bg-cream p-2.5 shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <EssayCover title={item.title} />
              <h4 className="mt-2.5 font-sans text-base font-normal leading-snug text-ink transition-colors duration-300 group-hover:text-accent">
                {item.title}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {item.description}
              </p>
              <p className="mt-1.5 text-xs text-ink-soft/80">
                <span>Essay</span>
                <span aria-hidden className="mx-1.5">·</span>
                <span>{item.date}</span>
              </p>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}