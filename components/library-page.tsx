'use client';

import { useMemo, useRef, useState } from 'react';
import type { BookItem, Persona } from '@/lib/types';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from './icons';
import { PERSONA_LABELS, ALL_PERSONAS } from '@/lib/constants';
import { NoSearchResults, NoContentState } from './ui/states';

interface LibraryPageProps {
  books: BookItem[];
  title: string;
  subheader: string;
}

/**
 * Aesthetic book cover card representing physical print texture, or the real
 * cover image when one is set.
 */
function BookCover({
  title,
  author,
  cover,
  link,
}: {
  title: string;
  author: string;
  cover?: string;
  link?: string;
}) {
  const inner = cover ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cover}
      alt={`${title} cover`}
      className="absolute inset-0 h-full w-full object-cover"
    />
  ) : (
    <>
      {/* Subtle book spine accent */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 top-0 w-2.5 border-r border-tinted/20 bg-night-soft"
      />

      <div className="pl-2">
        <span className="font-serif text-sm font-normal italic leading-snug text-paper sm:text-base">
          {title}
        </span>
      </div>

      <div className="flex items-baseline justify-between border-t border-tinted/20 pl-2 pt-2 text-[11px] text-ink-soft">
        <span className="truncate pr-1">{author}</span>
      </div>
    </>
  );

  return (
    <div className="relative flex aspect-[2/3] w-full flex-col justify-between overflow-hidden rounded-lg border border-tinted/20 bg-post-card p-4 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
      {link ? (
        <a
          href={link}
          target={link.startsWith('http') ? '_blank' : undefined}
          rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="absolute inset-0 block"
          aria-label={`Open ${title}`}
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}

export function LibraryPageView({ books, title, subheader }: LibraryPageProps) {
  const [search, setSearch] = useState('');
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scopeBooks = useMemo(
    () =>
      activePersona === null
        ? books
        : books.filter((b) => b.persona === activePersona),
    [books, activePersona],
  );

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of scopeBooks) {
      for (const topic of b.tags) {
        counts.set(topic, (counts.get(topic) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [scopeBooks]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return books.filter((b) => {
      const matchQuery =
        query === '' ||
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.description.toLowerCase().includes(query) ||
        b.tags.some((t) => t.toLowerCase().includes(query));
      const matchPersona =
        activePersona === null || b.persona === activePersona;
      const matchTopic =
        activeTopic === null || b.tags.includes(activeTopic);
      return matchQuery && matchPersona && matchTopic;
    });
  }, [books, search, activePersona, activeTopic]);

  const scroll = (dir: 1 | -1) => {
    listRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  const chipClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap text-sm transition-colors ${
      active
        ? 'text-accent underline underline-offset-4 font-medium'
        : 'text-paper/80 hover:text-accent'
    }`;

  return (
    <section aria-label="Library" className="container-site py-10 md:py-14">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-6">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl font-normal tracking-tight text-paper md:text-5xl">
            {title}
            <span className="ml-3 text-sea-blue">{books.length}</span>
          </h1>
          <p className="mt-2 font-serif text-lg italic text-ink-soft md:text-xl">
            {subheader}
          </p>
        </div>

        <div className="relative w-full max-w-xs pt-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-[calc(50%+2px)] h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books, authors, topics"
            aria-label="Search Library"
            className="w-full rounded-full border border-tinted/20 bg-night-soft py-2 pl-9 pr-4 text-sm text-paper placeholder:text-ink-soft/60 focus:border-tinted/40 focus:outline-none"
          />
        </div>
      </header>

      {/* Filter bar */}
      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="no-scrollbar flex w-full shrink-0 items-center gap-4 overflow-x-auto sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setActivePersona(null);
                setActiveTopic(null);
              }}
              className={chipClass(activePersona === null)}
            >
              All
            </button>
            {ALL_PERSONAS.map(
              (persona) => (
                <button
                  key={persona}
                  type="button"
                  onClick={() => {
                    setActivePersona(persona);
                    setActiveTopic(null);
                  }}
                  className={chipClass(activePersona === persona)}
                >
                  {PERSONA_LABELS[persona]}
                </button>
              ),
            )}
          </div>
          <span className="hidden h-4 w-[3px] shrink-0 rounded-full bg-sea-blue sm:block" aria-hidden />
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll topics left"
            className="hidden shrink-0 rounded-full p-1 text-ink-soft transition-colors hover:bg-night-soft hover:text-paper sm:inline-flex"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div
            ref={listRef}
            className="no-scrollbar hidden min-w-0 flex-1 items-center gap-4 overflow-x-auto sm:flex"
          >
            <button
              type="button"
              onClick={() => setActiveTopic(null)}
              className={chipClass(activeTopic === null)}
            >
              All
            </button>
            {topics.map(([topic]) => {
              const active = topic === activeTopic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setActiveTopic(active ? null : topic)}
                  className={chipClass(active)}
                >
                  {topic}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll topics right"
            className="hidden shrink-0 rounded-full p-1 text-ink-soft transition-colors hover:bg-night-soft hover:text-paper sm:inline-flex"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Book Grid */}
      <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((item) => (
          <article key={item.id} className="group">
            <BookCover
              title={item.title}
              author={item.author}
              cover={item.cover}
              link={item.link}
            />
            <div className="mt-3">
              <h3 className="font-serif text-base font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
                {item.link ? (
                  <a
                    href={item.link}
                    target={item.link.startsWith('http') ? '_blank' : undefined}
                    rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </h3>
              <p className="mt-0.5 text-xs text-ink-soft">{item.author}</p>
            </div>
          </article>
        ))}
      </div>

      {books.length === 0 ? (
        <NoContentState
          title="No books yet"
          description="The library shelf is currently empty."
        />
      ) : filtered.length === 0 ? (
        <NoSearchResults
          query={search || undefined}
          onReset={
            search || activePersona !== null
              ? () => {
                  setSearch('');
                  setActivePersona(null);
                }
              : undefined
          }
          resetLabel="Reset filters"
        />
      ) : null}

      {/* Reading Philosophy Note */}
      <footer className="mx-auto mt-20 max-w-2xl border-t border-tinted/20 pt-12 text-center">
        <p className="font-serif text-lg italic text-ink-soft">
          “Read slowly, re-read often, and let good ideas change the way you build.”
        </p>
      </footer>
    </section>
  );
}
