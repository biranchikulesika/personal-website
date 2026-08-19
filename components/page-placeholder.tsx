import type { PageContent } from '@/lib/types';

/**
 * Minimal structural placeholder page.
 * Used only to establish routes and information architecture.
 * Real page implementations will replace this.
 */
export function PagePlaceholder({ page }: { page: PageContent }) {
  return (
    <section className="container-site py-16 md:py-24">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
          {page.title}
        </h1>
        <p className="mt-4 font-serif text-lg italic text-accent">
          {page.description}
        </p>
        <div className="mt-6 border-t border-ink/10 pt-6 text-ink-soft">
          {page.content}
        </div>
      </div>
    </section>
  );
}