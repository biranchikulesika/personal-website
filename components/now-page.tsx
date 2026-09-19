import type { ReactNode } from 'react';
import type { NowEntry } from '@/lib/types';
import { renderMdx } from '@/lib/mdx';

interface NowPageViewProps {
  entries: NowEntry[];
}

export async function NowPageView({ entries }: NowPageViewProps) {
  const entryViews: ReactNode[] = [];
  for (const entry of entries) {
    entryViews.push(
      <section
        key={entry.id}
        className="relative ml-2 border-l border-dashed border-tinted/30 pl-8 md:ml-4 md:pl-12"
      >
        <span
          aria-hidden
          className={`absolute -left-[7px] top-2 h-3.5 w-3.5 rounded-full border-2 ${
            entryViews.length === 0 ? 'border-sea-blue' : 'border-tinted/40'
          } bg-night-soft shadow-sm`}
        />

        <article className="space-y-5 text-base leading-[1.85] text-paper/85 md:text-lg">
          <h3 className="font-serif text-2xl font-normal text-paper md:text-3xl">
            {entry.title}
          </h3>

          <div className="space-y-5">{await renderMdx(entry.content)}</div>

          {entry.createdAt && (
            <p className="pt-2 text-xs font-mono uppercase tracking-wider text-ink-soft/80 border-t border-tinted/15">
              Posted {new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {entry.location ? ` · ${entry.location}` : ''}
            </p>
          )}
        </article>
      </section>
    );
  }

  return (
    <div className="container-site py-10 md:py-16">
      <main className="mx-auto max-w-[760px]">
        {/* Header */}
        <header className="mb-14">
          <h1 className="font-serif text-4xl font-normal tracking-tight text-paper md:text-5xl">
            Now
            <span className="ml-3 text-sea-blue">{entries.length}</span>
          </h1>
          <p className="mt-2 font-serif text-lg italic text-ink-soft md:text-xl">
            What I’m reading, exploring, working on, and thinking about these days.
          </p>
        </header>

        {/* Timeline Log Entries */}
        <div className="space-y-16">{entryViews}</div>

        {/* Footer info & Now Movement Note */}
        <footer className="mt-20 border-t border-tinted/20 pt-10 text-center">
          <p className="text-sm text-ink-soft">
            This page is inspired by the{' '}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-paper underline decoration-tinted/40 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              /now movement
            </a>{' '}
            started by Derek Sivers.
          </p>
        </footer>
      </main>
    </div>
  );
}
