'use client';

import { useEffect, useState } from 'react';
import type { BlogPost, BookItem, NoteItem } from '@/lib/types';
import { NoSearchResults, NoContentState } from '@/components/ui/states';

type EmbedSourceType = 'book' | 'post' | 'note';

interface EmbedInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  books?: BookItem[];
  posts?: BlogPost[];
  notes?: NoteItem[];
  onSelect: (snippet: string) => void;
  initialType?: EmbedSourceType;
}

/**
 * Modal for embedding existing content (books, essays, notes) into a document.
 * Selecting an item inserts the matching `<Book />`, `<Post />`, or `<Note />`
 * block snippet at the cursor, just like the media picker.
 */
export function EmbedInsertModal({
  isOpen,
  onClose,
  books = [],
  posts = [],
  notes = [],
  onSelect,
  initialType,
}: EmbedInsertModalProps) {
  const [activeType, setActiveType] = useState<EmbedSourceType>(initialType || 'book');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && initialType) {
      setActiveType(initialType);
      setSearch('');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const tabs: { type: EmbedSourceType; label: string; count: number }[] = [
    { type: 'book', label: 'Books', count: books.length },
    { type: 'post', label: 'Essays', count: posts.length },
    { type: 'note', label: 'Notes', count: notes.length },
  ];

  function buildSnippet(type: EmbedSourceType, item: { slug: string; title: string }) {
    if (type === 'book') {
      const b = item as BookItem;
      const coverAttr = b.cover ? ` cover="${b.cover}"` : '';
      const linkAttr = b.link ? ` link="${b.link}"` : '';
      return `<Book title="${b.title}" author="${b.author}" year="${b.date}" description="${b.description}"${coverAttr}${linkAttr} />`;
    }
    if (type === 'post') {
      const p = item as BlogPost;
      return `<Post slug="${p.slug}" title="${p.title}" description="${p.description}" />`;
    }
    const n = item as NoteItem;
    return `<Note slug="${n.slug}" title="${n.title}" description="${n.description}" />`;
  }

  const q = search.toLowerCase();
  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
  );
  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.slug.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q)
  );

  const currentItems: { slug: string; title: string; subtitle: string }[] =
    activeType === 'book'
      ? filteredBooks.map((b) => ({ slug: b.slug, title: b.title, subtitle: b.author }))
      : activeType === 'post'
        ? filteredPosts.map((p) => ({ slug: p.slug, title: p.title, subtitle: p.subtitle || p.description }))
        : filteredNotes.map((n) => ({ slug: n.slug, title: n.title, subtitle: n.description }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs font-sans">
      <div className="relative my-8 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-tinted/20 bg-night text-paper shadow-2xl flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tinted/20 px-6 py-4">
          <div>
            <h3 className="font-serif text-xl font-normal text-paper">Embed Content</h3>
            <p className="mt-0.5 text-xs text-gray-mid">
              Insert a book, essay, or note card into this document, just like embedding media.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-mid hover:bg-night-soft hover:text-paper"
          >
            ✕
          </button>
        </div>

        {/* Type Tabs + Search */}
        <div className="border-b border-tinted/20 bg-night-soft px-6 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1 rounded-full bg-night p-1 border border-tinted/20">
              {tabs.map((tab) => (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => setActiveType(tab.type)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                    activeType === tab.type
                      ? 'bg-accent text-paper shadow-2xs'
                      : 'text-gray-mid hover:text-paper'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search title, author, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs rounded-full border border-tinted/20 bg-night px-4 py-1.5 text-xs text-paper placeholder:text-gray-mid/50 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {currentItems.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => {
                  onSelect(buildSnippet(activeType, item as never));
                  onClose();
                }}
                className="group flex flex-col rounded-2xl border border-tinted/20 bg-post-card p-4 text-left shadow-2xs transition-all hover:border-accent/40 hover:shadow-md focus:outline-none"
              >
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-mid">
                  <span aria-hidden>
                    {activeType === 'book' ? '📖' : activeType === 'post' ? '📄' : '📝'}
                  </span>
                  <span>{activeType === 'book' ? 'Book' : activeType === 'post' ? 'Essay' : 'Note'}</span>
                </div>
                <div className="mt-1.5 truncate text-sm font-medium text-paper group-hover:text-accent">
                  {item.title}
                </div>
                <div className="mt-0.5 truncate text-xs text-gray-mid">{item.subtitle}</div>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  Embed ↵
                </span>
              </button>
            ))}
          </div>

          {currentItems.length === 0 && (
            search ? (
              <NoSearchResults
                compact
                query={search}
                onReset={() => setSearch('')}
              />
            ) : (
              <NoContentState
                compact
                title={`No ${tabs.find((t) => t.type === activeType)?.label.toLowerCase()} available`}
                description="No items exist in this category yet."
              />
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-tinted/20 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-gray-mid hover:text-paper"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}