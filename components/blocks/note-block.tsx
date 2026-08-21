import { formatDisplayDate } from '@/lib/utils';

/**
 * NoteBlock — rendered from a `<Note slug="..." title="..." ... />` tag inside
 * markdown content. Links out to the note page.
 */
export function NoteBlock({
  slug,
  title,
  description,
  date,
}: {
  slug: string;
  title?: string;
  description?: string;
  date?: string;
}) {
  const href = `/n/${slug}`;
  return (
    <div className="my-8 rounded-2xl border border-tinted/20 bg-night-soft p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <a href={href} className="group block">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
          <span aria-hidden>📝</span>
          <span>Note</span>
          {date && (
            <>
              <span className="text-ink-soft/40">·</span>
              <span>{formatDisplayDate(date)}</span>
            </>
          )}
        </div>
        <h4 className="mt-2 font-serif text-lg font-normal leading-snug text-paper transition-colors group-hover:text-accent md:text-xl">
          {title || slug}
        </h4>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors group-hover:text-paper">
          Read note
          <span aria-hidden>→</span>
        </span>
      </a>
    </div>
  );
}