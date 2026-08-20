'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { BookItem, Persona } from '@/lib/types';
import { saveBookAction, deleteBookAction } from '@/app/admin/actions';
import { ExternalLinkIcon, PencilIcon, TrashIcon } from '@/components/icons';

interface LibraryManagerProps {
  initialBooks: BookItem[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function LibraryManager({ initialBooks }: LibraryManagerProps) {
  const [books, setBooks] = useState<BookItem[]>(initialBooks);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    slug: string;
    title: string;
  } | null>(null);
  const [confirmTypedTitle, setConfirmTypedTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function openDeleteConfirm(book: BookItem) {
    setConfirmTypedTitle('');
    setDeleteConfirm({ slug: book.slug, title: book.title });
  }

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [persona, setPersona] = useState<Persona>('thinker');
  const [tagsInput, setTagsInput] = useState('');

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function handleOpenCreate() {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setSlug('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setPersona('thinker');
    setTagsInput('philosophy, craft');
    setIsEditing(true);
  }

  function handleOpenEdit(book: BookItem) {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setSlug(book.slug);
    setDescription(book.description);
    setDate(book.date);
    setPersona(book.persona);
    setTagsInput(book.tags.join(', '));
    setIsEditing(true);
  }

  function handleSaveBook(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !slug.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const bookPayload: BookItem = {
      id: editingBook ? editingBook.id : `book-${Date.now()}`,
      title,
      author,
      slug: slugify(slug),
      description,
      date: date || new Date().toISOString().split('T')[0],
      persona,
      tags: parsedTags.length > 0 ? parsedTags : ['book'],
    };

    startTransition(async () => {
      const res = await saveBookAction(bookPayload);
      if (res.success && res.book) {
        setBooks((prev) => {
          const idx = prev.findIndex((b) => b.slug === bookPayload.slug);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = bookPayload;
            return copy;
          }
          return [bookPayload, ...prev];
        });
        setIsEditing(false);
        showToast(`Book "${title}" saved to library shelf!`);
      } else {
        showToast(res.error || 'Failed to save book');
      }
    });
  }

  function handleDeleteBook() {
    if (!deleteConfirm) return;
    const { slug, title } = deleteConfirm;
    if (confirmTypedTitle !== title) return;

    startTransition(async () => {
      const res = await deleteBookAction(slug);
      if (res.success) {
        setBooks((prev) => prev.filter((b) => b.slug !== slug));
        setDeleteConfirm(null);
        showToast(`"${title}" removed from library`);
      } else {
        showToast(res.error || 'Failed to delete book');
      }
    });
  }

  const filteredBooks = books.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-cream shadow-xl ring-1 ring-tinted animate-in fade-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-normal text-ink md:text-3xl">
            Library & Bookshelf
          </h2>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-accent"
        >
          <span>+ Add Book</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search library by title, author, tag, or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-full border border-tinted bg-cream px-4 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
        />
      </div>

      {/* Books Table */}
      <div className="overflow-hidden rounded-2xl border border-tinted bg-cream shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-tinted bg-paper/60 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-5 py-3.5">Title & Author</th>
                <th className="px-4 py-3.5">Date Read / Added</th>
                <th className="px-4 py-3.5">Persona</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tinted/60">
              {filteredBooks.map((book) => (
                <tr key={book.slug} className="transition-colors hover:bg-paper/40">
                  <td className="px-5 py-4">
                    <div className="font-serif text-base font-medium text-ink">
                      {book.title}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      by <span className="font-medium text-ink/90">{book.author}</span>
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs text-ink-soft whitespace-nowrap">
                    {book.date}
                  </td>
                  <td className="px-4 py-4 text-xs text-ink-soft">
                    <span className="capitalize">{book.persona}</span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href="/library"
                        target="_blank"
                        title="View on Shelf"
                        aria-label={`View ${book.title} on shelf`}
                        className="rounded-full p-2 text-ink-soft transition-colors hover:bg-paper hover:text-ink"
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        title="Edit"
                        aria-label={`Edit ${book.title}`}
                        onClick={() => handleOpenEdit(book)}
                        className="rounded-full p-2 text-ink transition-colors hover:bg-paper"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Remove"
                        aria-label={`Remove ${book.title}`}
                        onClick={() => openDeleteConfirm(book)}
                        className="rounded-full p-2 text-red-700 transition-colors hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-ink-soft">
                    No books match that search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-tinted bg-paper p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-serif text-xl font-normal text-ink">
              Remove Book?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Are you sure you want to remove <b className="text-ink">{deleteConfirm.title}</b> from the Library shelf? This action cannot be undone.
              <span className="mt-3 block">Type the full title to confirm:</span>
            </p>
            <input
              type="text"
              autoFocus
              placeholder="Type the full title to confirm"
              value={confirmTypedTitle}
              onChange={(e) => setConfirmTypedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && confirmTypedTitle === deleteConfirm.title) {
                  handleDeleteBook();
                }
              }}
              className="mt-3 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-full px-4 py-2 text-xs font-medium text-ink-soft hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || confirmTypedTitle !== deleteConfirm.title}
                onClick={handleDeleteBook}
                className="rounded-full bg-red-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-800 disabled:opacity-50"
              >
                {isPending ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs sm:p-6">
          <div className="relative my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-tinted bg-paper p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-tinted pb-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-ink">
                  {editingBook ? 'Edit Book' : 'Add Book to Library'}
                </h3>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Add reading notes, author details, and taxonomy tags.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full p-2 text-ink-soft hover:bg-cream hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Book Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Book Title..."
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!editingBook && !slug) {
                        setSlug(slugify(e.target.value));
                      }
                    }}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Author Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Author Name..."
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Slug Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="book-slug"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Note / Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Key takeaway, reflection, or note on this book..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full resize-none rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Date Read / Added
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Persona Theme
                  </label>
                  <select
                    value={persona}
                    onChange={(e) => setPersona(e.target.value as Persona)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="builder">Builder</option>
                    <option value="operator">Operator</option>
                    <option value="thinker">Thinker</option>
                    <option value="wanderer">Wanderer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="philosophy, design"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-tinted">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-ink px-6 py-2 text-xs font-semibold text-cream shadow-sm hover:bg-accent disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
