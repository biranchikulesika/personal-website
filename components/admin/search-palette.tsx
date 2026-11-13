"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
} from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { Badge, TypeBadge } from "./ui";
import { SearchIcon } from "@/components/icons";

export interface SearchResult {
  id: string;
  kind: "post" | "note" | "now" | "book" | "media";
  title: string;
  meta: string;
  date?: string;
  onSelect: () => void;
}

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  posts: BlogPost[];
  notes: NoteItem[];
  books: BookItem[];
  nowEntries: NowEntry[];
  media: MediaItem[];
  onOpenContent: (
    kind: "post" | "note" | "now" | "book",
    slug: string,
  ) => void;
  onOpenMedia: (query: string) => void;
}

export function SearchPalette({
  isOpen,
  onClose,
  posts,
  notes,
  books,
  nowEntries,
  media,
  onOpenContent,
  onOpenMedia,
}: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    const term = query.trim().toLowerCase();
    const match = (value?: string | null) =>
      Boolean(value && value.toLowerCase().includes(term));

    const content: SearchResult[] = [
      ...posts.map((post) => ({
        id: `post-${post.slug}`,
        kind: "post" as const,
        title: post.title,
        meta: `Essay · ${post.persona ?? "builder"}`,
        date: post.lastEditedAt || post.publishedAt,
        onSelect: () => onOpenContent("post", post.slug),
      })),
      ...notes.map((note) => ({
        id: `note-${note.slug}`,
        kind: "note" as const,
        title: note.title,
        meta: `Note · ${note.persona ?? "builder"}`,
        date: note.date,
        onSelect: () => onOpenContent("note", note.slug),
      })),
      ...nowEntries.map((entry) => ({
        id: `now-${entry.id}`,
        kind: "now" as const,
        title: entry.title || "Now entry",
        meta: "Now",
        date: entry.date,
        onSelect: () => onOpenContent("now", entry.slug || entry.id),
      })),
      ...books.map((book) => ({
        id: `book-${book.slug}`,
        kind: "book" as const,
        title: book.title,
        meta: `Book · ${book.author}`,
        date: book.date,
        onSelect: () => onOpenContent("book", book.slug),
      })),
    ].filter((item) => !term || match(item.title) || match(item.meta));

    const assets: SearchResult[] = media
      .filter(
        (item) =>
          !term ||
          match(item.name) ||
          match(item.alt) ||
          item.tags.some((tag) => match(tag)),
      )
      .map((item) => ({
        id: `media-${item.id}`,
        kind: "media" as const,
        title: item.name,
        meta: `Media · ${item.dimensions ?? item.size}`,
        date: item.uploadedAt,
        onSelect: () => onOpenMedia(item.name),
      }));

    const ordered = term
      ? [...content, ...assets]
      : [...content.slice(0, 6), ...assets.slice(0, 3)];

    return ordered.slice(0, 24);
  }, [
    query,
    posts,
    notes,
    books,
    nowEntries,
    media,
    onOpenContent,
    onOpenMedia,
  ]);

  useEffect(() => {
    if (activeIndex >= results.length) setActiveIndex(0);
  }, [activeIndex, results.length]);

  if (!isOpen) return null;

  const typeLabel: Record<SearchResult["kind"], string> = {
    post: "Essay",
    note: "Note",
    now: "Now",
    book: "Book",
    media: "Media",
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-xs"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search admin content"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-tinted/30 bg-night-soft shadow-2xl"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          // Arrow/Enter handling belongs to the input; let result buttons
          // handle their own native Enter activation.
          if (event.target !== inputRef.current) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % Math.max(results.length, 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(
              (index) =>
                (index - 1 + Math.max(results.length, 1)) %
                Math.max(results.length, 1),
            );
          }
          if (event.key === "Enter" && results[activeIndex]) {
            event.preventDefault();
            results[activeIndex].onSelect();
          }
        }}
      >
        <div className="flex items-center gap-2.5 border-b border-tinted/20 px-4">
          <SearchIcon className="h-4 w-4 shrink-0 text-gray-mid" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search essays, notes, books, media…"
            aria-label="Search admin content"
            className="h-12 w-full bg-transparent text-sm text-paper placeholder:text-gray-mid/60 focus:outline-none"
          />
          <kbd className="shrink-0 rounded border border-tinted/40 px-1.5 py-0.5 text-[10px] text-gray-mid">
            Esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-gray-mid">
              No matches for “{query}”.
            </p>
          ) : (
            <ul role="listbox" aria-label="Search results">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={result.onSelect}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      index === activeIndex ? "bg-post-card" : "hover:bg-post-card/60"
                    }`}
                  >
                    <span className="w-14 shrink-0">
                      {result.kind === "media" ? (
                        <Badge tone="grey">{typeLabel[result.kind]}</Badge>
                      ) : (
                        <TypeBadge kind={result.kind} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-paper">
                        {result.title}
                      </span>
                      <span className="block truncate text-xs text-gray-mid">
                        {result.meta}
                      </span>
                    </span>
                    {result.date && (
                      <span className="shrink-0 text-[11px] text-gray-mid">
                        {formatDisplayDate(result.date)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-tinted/20 px-4 py-2 text-[10px] text-gray-mid">
          <span>↑↓ to navigate</span>
          <span>↵ to open</span>
          <span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
