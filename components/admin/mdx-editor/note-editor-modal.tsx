'use client';

import { useState, useTransition } from 'react';
import {
  deleteNoteAction,
  saveNoteAction,
} from '@/app/admin/actions';
import type {
  BlogPost,
  BookItem,
  NoteItem,
  Persona,
} from '@/lib/types';
import {
  slugify,
} from '@/lib/utils';
import { MDXEditor } from './mdx-editor';

interface NoteEditorModalProps {
  /** The note being edited, or null for create-new. */
  editingNote: NoteItem | null;
  /** All notes (for slug collision checks and embeds). */
  allNotes: NoteItem[];
  /** All posts (for slug collision checks and embeds). */
  allPosts: BlogPost[];
  /** All books (for slug collision checks and embeds). */
  allBooks: BookItem[];
  /** Callback after save succeeds — parent should update its list. */
  onSaved: (note: NoteItem, oldSlug?: string) => void;
  /** Callback when the modal is closed (cancel or after save). */
  onClose: () => void;
  /** Toast notification helper. */
  showToast: (msg: string) => void;
}

/**
 * Self-contained note editor modal. All editor state lives here so that
 * typing never causes the parent ContentManager to re-render.
 */
export function NoteEditorModal({
  editingNote,
  allNotes,
  allPosts,
  allBooks,
  onSaved,
  onClose,
  showToast,
}: NoteEditorModalProps) {
  const [isPending, startTransition] = useTransition();

  // All note metadata state lives here, not in ContentManager.
  const [title, setTitle] = useState(editingNote?.title ?? '');
  const [slug, setSlug] = useState(editingNote?.slug ?? '');
  const [subtitle, setSubtitle] = useState(editingNote?.subtitle ?? '');
  const [description, setDescription] = useState(editingNote?.description ?? '');
  const [date, setDate] = useState(
    editingNote?.date ?? new Date().toISOString().split('T')[0],
  );
  const [persona, setPersona] = useState<Persona>(
    editingNote?.persona ?? 'thinker',
  );
  const [status, setStatus] = useState<'published' | 'unpublished'>(
    editingNote?.status ?? 'published',
  );
  const [tagsInput, setTagsInput] = useState(
    editingNote ? editingNote.tags.join(', ') : 'notes, thoughts',
  );
  const [mdxContent, setMdxContent] = useState(
    editingNote
      ? editingNote.content.join('\n\n')
      : defaultNoteContent(),
  );

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const cleanSlug = slugify(slug || title || 'untitled-note');
    const isTakenByNote = allNotes.some(
      (n) => n.slug === cleanSlug && n.slug !== editingNote?.slug,
    );
    const isTakenByPost = allPosts.some((p) => p.slug === cleanSlug);
    const isTakenByBook = allBooks.some((b) => b.slug === cleanSlug);
    if (isTakenByNote || isTakenByPost || isTakenByBook) {
      showToast(
        `Slug "${cleanSlug}" is already in use. Please choose a unique slug.`,
      );
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const parsedParagraphs = mdxContent
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const notePayload: NoteItem = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      title,
      slug: cleanSlug,
      subtitle: subtitle.trim() || undefined,
      description:
        description ||
        subtitle ||
        (parsedParagraphs[0] ? parsedParagraphs[0].slice(0, 120) : title),
      content:
        parsedParagraphs.length > 0 ? parsedParagraphs : [description],
      date: date || new Date().toISOString().split('T')[0],
      persona,
      tags: parsedTags.length > 0 ? parsedTags : ['note'],
      status,
    };

    const oldSlug = editingNote?.slug;

    startTransition(async () => {
      if (editingNote && editingNote.slug !== cleanSlug) {
        await deleteNoteAction(editingNote.slug);
      }
      const res = await saveNoteAction(notePayload);
      if (res.success && res.note) {
        onSaved(notePayload, oldSlug);
        showToast(`Note "${title}" saved successfully!`);
      } else {
        showToast(res.error || 'Failed to save note');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6 backdrop-blur-xs">
      <div className="relative my-4 max-h-[96vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-tinted/20 bg-night p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-tinted/20 pb-4">
          <div>
            <h3 className="font-serif text-2xl font-normal text-paper">
              {editingNote ? 'Edit Note' : 'New Note'}
            </h3>
            <p className="mt-0.5 text-xs text-gray-mid">
              Capture an atomic thought or observation with live MDX
              preview.
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

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Metadata: Title, Slug, Status, Persona */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="note-title" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Title
              </label>
              <input
                id="note-title"
                type="text"
                required
                placeholder="Note title..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingNote && !slug) {
                    setSlug(slugify(e.target.value));
                  }
                }}
                className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="note-slug" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Slug
              </label>
              <input
                id="note-slug"
                type="text"
                required
                placeholder="note-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 font-mono text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="note-subtitle" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
              Subtitle (Optional)
            </label>
            <input
              id="note-subtitle"
              type="text"
              placeholder="Short subtitle or core premise..."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as 'published' | 'unpublished',
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-xs text-paper focus:border-tinted/40 focus:outline-none"
              >
                <option value="published" className="bg-night text-paper">
                  Published
                </option>
                <option value="unpublished" className="bg-night text-paper">
                  Draft
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Persona Theme
              </label>
              <select
                value={persona}
                onChange={(e) =>
                  setPersona(e.target.value as Persona)
                }
                className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-xs text-paper focus:border-tinted/40 focus:outline-none"
              >
                <option value="builder" className="bg-night text-paper">
                  Builder
                </option>
                <option value="operator" className="bg-night text-paper">
                  Operator
                </option>
                <option value="thinker" className="bg-night text-paper">
                  Thinker
                </option>
                <option value="wanderer" className="bg-night text-paper">
                  Wanderer
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-xs text-paper focus:border-tinted/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Tags
              </label>
              <input
                type="text"
                placeholder="philosophy, web"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-xs text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
              />
            </div>
          </div>

          {/* MDX Note Editor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid mb-1.5">
              Note Content (Markdown & MDX)
            </label>
            <MDXEditor
              initialContent={mdxContent}
              title={title}
              subtitle={description}
              persona={persona}
              date={date}
              mediaItems={[]}
              embedBooks={allBooks}
              embedPosts={allPosts}
              embedNotes={allNotes}
              onChange={(val) => setMdxContent(val)}
              className="h-[440px]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-tinted/20">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2 text-xs font-semibold text-gray-mid hover:text-paper"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-accent px-6 py-2.5 text-xs font-semibold text-paper shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving Note...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function defaultNoteContent(): string {
  return (
    'An atomic thought or brief observation.\n\n' +
    '> [!TIP]\n> Keep notes focused on a single coherent idea.'
  );
}
