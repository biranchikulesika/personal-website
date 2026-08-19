'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  ScribbleEntry,
  ScribbleEntryType,
  Persona,
} from '@/lib/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from './icons';

interface ScribblePageProps {
  entries: ScribbleEntry[];
}

const TYPE_LABELS: Record<ScribbleEntryType, string> = {
  essay: 'Essay',
  note: 'Note',
  book: 'Library',
};

const PERSONA_LABELS: Record<Persona, string> = {
  builder: 'Builder',
  operator: 'Operator',
  thinker: 'Thinker',
  wanderer: 'Wanderer',
};

/**
 * Card metadata row: "Type · date".
 */
function CardMeta({
  type,
  date,
}: {
  type: ScribbleEntryType;
  date: string;
}) {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
      <span>{TYPE_LABELS[type]}</span>
      <span className="h-1 w-1 rounded-full bg-ink-soft" aria-hidden />
      <span>{date}</span>
    </p>
  );
}

/**
 * Placeholder cover for essay cards, blending softly into the background on all four sides.
 */
function EssayCover({ title }: { title: string }) {
  return (
    <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_center,var(--color-paper)_15%,transparent_75%)]">
      <span className="font-serif text-5xl italic text-ink-soft/40 transition-transform duration-300 group-hover:scale-110">
        {title.charAt(0)}
      </span>
    </div>
  );
}

/**
 * Placeholder cover for book cards, blending softly into the background on all four sides.
 */
function BookCover({ title, author }: { title: string; author?: string }) {
  return (
    <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_center,var(--color-paper)_15%,transparent_75%)] p-4">
      <div className="flex aspect-[2/3] h-full max-h-32 flex-col justify-between rounded bg-cream p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-105">
        <span className="text-center font-serif text-xs italic leading-tight text-ink line-clamp-3">
          {title}
        </span>
        {author && (
          <span className="truncate text-center text-[10px] text-ink-soft">
            {author}
          </span>
        )}
      </div>
    </div>
  );
}

function NoteCard({ entry }: { entry: ScribbleEntry }) {
  return (
    <article className="py-2">
      <Link href={entry.href} className="group block">
        <h3 className="font-serif text-xl font-normal leading-snug text-ink transition-colors duration-300 group-hover:text-accent">
          {entry.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {entry.description}
        </p>
        <CardMeta
          type={entry.type}
          date={entry.date}
        />
      </Link>
    </article>
  );
}

function EssayCard({ entry }: { entry: ScribbleEntry }) {
  return (
    <article>
      <Link
        href={entry.href}
        className="group block rounded-2xl border border-tinted bg-cream p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      >
        <EssayCover title={entry.title} />
        <div className="mt-3.5">
          <h3 className="font-serif text-lg font-normal leading-snug text-ink transition-colors duration-300 group-hover:text-accent">
            {entry.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{entry.description}</p>
          <CardMeta
            type={entry.type}
            date={entry.date}
          />
        </div>
      </Link>
    </article>
  );
}

function BookCard({ entry }: { entry: ScribbleEntry }) {
  return (
    <article>
      <Link
        href={entry.href}
        className="group block rounded-2xl border border-tinted bg-cream p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      >
        <BookCover title={entry.title} author={entry.author} />
        <div className="mt-3.5">
          <h3 className="font-serif text-lg font-normal leading-snug text-ink transition-colors duration-300 group-hover:text-accent">
            {entry.title}
          </h3>
          {entry.author && (
            <p className="mt-0.5 text-xs text-ink-soft">{entry.author}</p>
          )}
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{entry.description}</p>
          <CardMeta
            type={entry.type}
            date={entry.date}
          />
        </div>
      </Link>
    </article>
  );
}

const CARD_BY_TYPE: Record<
  ScribbleEntryType,
  (props: { entry: ScribbleEntry }) => ReactNode
> = {
  essay: EssayCard,
  note: NoteCard,
  book: BookCard,
};

/**
 * Filter bar — persona chips on the left, a sea-blue rule, then a scrollable
 * topic chip list. The topics shown depend on the selected persona: All shows
 * topics from every persona; a specific persona narrows the topics to that
 * persona's entries.
 */
function FilterBar({
  activePersona,
  onPersonaSelect,
  topics,
  activeTopic,
  onTopicSelect,
}: {
  activePersona: Persona | null;
  onPersonaSelect: (persona: Persona | null) => void;
  topics: [string, number][];
  activeTopic: string | null;
  onTopicSelect: (topic: string | null) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    listRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  const chipClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap text-sm transition-colors ${
      active
        ? 'text-accent underline underline-offset-4'
        : 'text-ink hover:text-accent'
    }`;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          onClick={() => onPersonaSelect(null)}
          className={chipClass(activePersona === null)}
        >
          All
        </button>
        {(['builder', 'operator', 'thinker', 'wanderer'] as const).map(
          (persona) => (
            <button
              key={persona}
              type="button"
              onClick={() => onPersonaSelect(persona)}
              className={chipClass(activePersona === persona)}
            >
              {PERSONA_LABELS[persona]}
            </button>
          ),
        )}
      </div>
      <span className="h-4 w-[3px] shrink-0 rounded-full bg-sea-blue" aria-hidden />
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Scroll topics left"
        className="shrink-0 rounded-full p-1 text-ink-soft transition-colors hover:bg-cream hover:text-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <div
        ref={listRef}
        className="no-scrollbar flex min-w-0 flex-1 items-center gap-4 overflow-x-auto"
      >
        <button
          type="button"
          onClick={() => onTopicSelect(null)}
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
              onClick={() => onTopicSelect(topic)}
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
        className="shrink-0 rounded-full p-1 text-ink-soft transition-colors hover:bg-cream hover:text-ink"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ScribblePage({ entries }: ScribblePageProps) {
  const [search, setSearch] = useState('');
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const scopeEntries = useMemo(
    () =>
      activePersona === null
        ? entries
        : entries.filter((entry) => entry.persona === activePersona),
    [entries, activePersona],
  );

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of scopeEntries) {
      for (const topic of entry.topics) {
        counts.set(topic, (counts.get(topic) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [scopeEntries]);

  const handlePersonaSelect = (persona: Persona | null) => {
    setActivePersona(persona);
    setActiveTopic(null);
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const searchMatch =
        query === '' ||
        entry.title.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        entry.topics.some((topic) => topic.toLowerCase().includes(query));
      const personaMatch =
        activePersona === null || entry.persona === activePersona;
      const topicMatch =
        activeTopic === null || entry.topics.includes(activeTopic);
      return searchMatch && personaMatch && topicMatch;
    });
  }, [entries, search, activePersona, activeTopic]);

  return (
    <section aria-label="Scribble" className="container-site py-10 md:py-14">
      <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-6">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl font-normal tracking-tight md:text-5xl">
            Scribble
            <span className="ml-3 text-sea-blue">{entries.length}</span>
          </h1>
          <p className="mt-2 font-serif text-lg italic text-ink-soft md:text-xl">
            Essays, notes, and reading — writing and thinking, tended in the
            open.
          </p>
        </div>
        <div className="relative w-full max-w-xs pt-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-[calc(50%+2px)] h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Scribble"
            aria-label="Search Scribble"
            className="w-full rounded-full border border-tinted bg-cream py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-soft/70 focus:border-ink/40 focus:outline-none"
          />
        </div>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
        <FilterBar
          activePersona={activePersona}
          onPersonaSelect={handlePersonaSelect}
          topics={topics}
          activeTopic={activeTopic}
          onTopicSelect={(topic) =>
            setActiveTopic(activeTopic === topic ? null : topic)
          }
        />
      </div>

      <div className="scribble-grid mt-10">
        {entries.map((entry) => {
          const Card = CARD_BY_TYPE[entry.type];
          const hidden = !filtered.includes(entry);
          return (
            <div
              key={entry.id}
              className={`grid-item ${hidden ? 'filtered-out' : ''}`}
            >
              <Card entry={entry} />
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-soft">
          Nothing matches those filters yet. Loosen a filter to keep browsing.
        </p>
      )}
    </section>
  );
}