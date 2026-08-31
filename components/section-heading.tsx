import Link from 'next/link';
import { ArrowRightIcon } from './icons';

interface SectionHeadingProps {
  id?: string;
  title: string;
  href?: string;
  subheader?: string;
  level?: 'h2' | 'h3';
}

/**
 * Section heading used across the homepage content area.
 * When `href` is provided, renders a title + arrow linking to the full
 * section page, with an optional one-line subheader beneath. Without
 * `href`, renders a plain title (used for sections that live entirely on
 * the homepage).
 */
export function SectionHeading({
  id,
  title,
  href,
  subheader,
  level = 'h2',
}: SectionHeadingProps) {
  const HeadingTag = level;

  return (
    <div className="mb-6">
      {href ? (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-paper transition-colors hover:text-accent"
        >
          <HeadingTag id={id} className="font-serif text-2xl font-normal tracking-tight md:text-3xl">
            {title}
          </HeadingTag>
          <ArrowRightIcon className="h-[18px] w-[18px] -translate-x-1 text-sea-blue opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </Link>
      ) : (
        <HeadingTag id={id} className="font-serif text-2xl font-normal tracking-tight text-paper md:text-3xl">
          {title}
        </HeadingTag>
      )}

      {subheader && (
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft md:text-base">
          {subheader}
        </p>
      )}
    </div>
  );
}