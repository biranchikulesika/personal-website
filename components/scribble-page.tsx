'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  ScribbleEntry,
  Persona,
} from '@/lib/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from './icons';
import { formatDisplayDate, formatNoteSnippet } from '@/lib/utils';
import { PERSONA_LABELS, ALL_PERSONAS } from '@/lib/constants';
import { EssayCover } from './ui/essay-cover';
import { NoSearchResults, NoContentState } from './ui/states';

interface ScribblePageProps {
  entries: ScribbleEntry[];
}

const TYPE_LABELS: Record<string, string> = {
  essay: 'Essay',
  note: 'Note',
};

/**
 * Card metadata row: "Type · date".
 */
function CardMeta({
  type,
  date,
}: {
  type: string;
  date: string;
}) {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-mid">
      <span>{TYPE_LABELS[type]}</span>
      <span className="h-1 w-1 rounded-full bg-gray-mid" aria-hidden />
      <span>{formatDisplayDate(date)}</span>
    </p>
  );
}



function NoteCard({ entry }: { entry: ScribbleEntry }) {
  const snippet = formatNoteSnippet(entry.description, 180);
  const isTruncated = snippet.endsWith('...read now');
  const mainSnippet = isTruncated ? snippet.slice(0, -11) : snippet;

  return (
    <article className="py-2">
      <Link href={entry.href} className="group block">
        <h3 className="font-serif text-xl font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
          {entry.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-mid">
          {mainSnippet}
          {isTruncated && (
            <span className="ml-1 inline font-medium text-accent/90 transition-colors group-hover:text-accent">
              ...read now
            </span>
          )}
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
        className="group block rounded-2xl border border-tinted/20 bg-post-card p-4 shadow-xs transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
      >
        <EssayCover title={entry.title} coverImage={entry.coverImage} />
        <div className="mt-3.5">
          <h3 className="font-serif text-lg font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
            {entry.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-mid">{entry.description}</p>
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
  string,
  (props: { entry: ScribbleEntry }) => ReactNode
> = {
  essay: EssayCard,
  note: NoteCard,
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
        ? 'text-accent underline underline-offset-4 font-medium'
        : 'text-paper/80 hover:text-accent'
    }`;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-start gap-3 sm:flex-row sm:items-center">
      <div className="no-scrollbar flex w-full shrink-0 items-center gap-4 overflow-x-auto sm:w-auto">
        <button
          type="button"
          onClick={() => onPersonaSelect(null)}
          className={chipClass(activePersona === null)}
        >
          All
        </button>
        {ALL_PERSONAS.map(
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
        className="hidden shrink-0 rounded-full p-1 text-ink-soft transition-colors hover:bg-night-soft hover:text-paper sm:inline-flex"
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
          <h1 className="font-serif text-4xl font-normal tracking-tight text-paper md:text-5xl">
            Scribble
            <span className="ml-3 text-sea-blue">{entries.length}</span>
          </h1>
          <p className="mt-2 font-serif text-lg italic text-ink-soft md:text-xl">
            Writing and thinking, shared openly.
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
            className="w-full rounded-full border border-tinted/20 bg-night-soft py-2 pl-9 pr-4 text-sm text-paper placeholder:text-ink-soft/60 focus:border-tinted/40 focus:outline-none"
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

      {entries.length === 0 ? (
        <NoContentState
          title="No entries yet"
          description="Nothing has been published to Scribble yet."
        />
      ) : filtered.length === 0 ? (
        <NoSearchResults
          query={search || undefined}
          onReset={
            search || activePersona || activeTopic
              ? () => {
                  setSearch('');
                  setActivePersona(null);
                  setActiveTopic(null);
                }
              : undefined
          }
          resetLabel="Reset filters"
        />
      ) : null}
    </section>
  );
}
