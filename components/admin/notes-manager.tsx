'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { NoteItem, Persona } from '@/lib/types';
import { saveNoteAction, deleteNoteAction } from '@/app/admin/actions';

interface NotesManagerProps {
  initialNotes: NoteItem[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function NotesManager({ initialNotes }: NotesManagerProps) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [persona, setPersona] = useState<Persona>('thinker');
  const [tagsInput, setTagsInput] = useState('');
  const [contentText, setContentText] = useState('');

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function handleOpenCreate() {
    setEditingNote(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setPersona('thinker');
    setTagsInput('note, thoughts');
    setContentText('A brief observation or note on something that caught my attention.');
    setIsEditing(true);
  }

  function handleOpenEdit(note: NoteItem) {
    setEditingNote(note);
    setTitle(note.title);
    setSlug(note.slug);
    setDescription(note.description);
    setDate(note.date);
    setPersona(note.persona);
    setTagsInput(note.tags.join(', '));
    setContentText(note.content.join('\n\n'));
    setIsEditing(true);
  }

  function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const parsedContent = contentText
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const notePayload: NoteItem = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      title,
      slug: slugify(slug),
      description,
      date: date || new Date().toISOString().split('T')[0],
      persona,
      tags: parsedTags.length > 0 ? parsedTags : ['note'],
      content: parsedContent.length > 0 ? parsedContent : [description],
    };

    startTransition(async () => {
      const res = await saveNoteAction(notePayload);
      if (res.success && res.note) {
        setNotes((prev) => {
          const idx = prev.findIndex((n) => n.slug === notePayload.slug);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = notePayload;
            return copy;
          }
          return [notePayload, ...prev];
        });
        setIsEditing(false);
        showToast(`Note "${title}" saved successfully!`);
      } else {
        showToast(res.error || 'Failed to save note');
      }
    });
  }

  function handleDeleteNote(slugToDelete: string) {
    startTransition(async () => {
      const res = await deleteNoteAction(slugToDelete);
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.slug !== slugToDelete));
        setDeleteConfirmSlug(null);
        showToast('Note deleted successfully');
      } else {
        showToast(res.error || 'Failed to delete note');
      }
    });
  }

  const filteredNotes = notes.filter((n) => {
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.slug.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
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
            Notes & Thoughts
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Manage atomic notes, research logs, and observations ({notes.length} total).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-accent"
        >
          <span>+ New Note</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search notes by title, tag, or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-full border border-tinted bg-cream px-4 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
        />
      </div>

      {/* Notes Table */}
      <div className="overflow-hidden rounded-2xl border border-tinted bg-cream shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-tinted bg-paper/60 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-5 py-3.5">Title & Summary</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Persona</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tinted/60">
              {filteredNotes.map((note) => (
                <tr key={note.slug} className="transition-colors hover:bg-paper/40">
                  <td className="px-5 py-4">
                    <div className="font-serif text-base font-medium text-ink">
                      {note.title}
                    </div>
                    <p className="mt-0.5 max-w-md truncate text-xs text-ink-soft">
                      {note.description}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs text-ink-soft whitespace-nowrap">
                    {note.date}
                  </td>
                  <td className="px-4 py-4 text-xs text-ink-soft">
                    <span className="capitalize">{note.persona}</span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/n/${note.slug}`}
                        target="_blank"
                        className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink-soft shadow-xs ring-1 ring-tinted transition-colors hover:text-ink hover:bg-cream"
                      >
                        View ↗
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(note)}
                        className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink shadow-xs ring-1 ring-tinted transition-colors hover:bg-ink hover:text-cream"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmSlug(note.slug)}
                        className="rounded-full px-2.5 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredNotes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-ink-soft">
                    No notes match that search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-tinted bg-paper p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-serif text-xl font-normal text-ink">
              Delete Note?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Are you sure you want to delete note <b className="text-ink">{deleteConfirmSlug}</b>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmSlug(null)}
                className="rounded-full px-4 py-2 text-xs font-medium text-ink-soft hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDeleteNote(deleteConfirmSlug)}
                className="rounded-full bg-red-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-800 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs sm:p-6">
          <div className="relative my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-tinted bg-paper p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-tinted pb-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-ink">
                  {editingNote ? 'Edit Note' : 'Create New Note'}
                </h3>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Capture an atomic thought or observation.
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

            <form onSubmit={handleSaveNote} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Note Title..."
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!editingNote && !slug) {
                        setSlug(slugify(e.target.value));
                      }
                    }}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Slug
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="note-slug"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Summary / Excerpt
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Short description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full resize-none rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Date
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
                    Persona
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
                    placeholder="tag1, tag2"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Content Body (Separate paragraphs with double newline)
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Note body..."
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
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
                  {isPending ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
