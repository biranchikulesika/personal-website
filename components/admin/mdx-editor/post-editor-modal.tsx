'use client';

import { useState, useTransition } from 'react';
import {
  deletePostAction,
  savePostAction,
} from '@/app/admin/actions';
import type {
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  Persona,
} from '@/lib/types';
import {
  markdownToPostSections,
  sectionsToMarkdown,
  slugify,
} from '@/lib/utils';
import { MDXEditor } from './mdx-editor';

interface PostEditorModalProps {
  /** The post being edited, or null for create-new. */
  editingPost: BlogPost | null;
  /** All posts (for slug collision checks and embeds). */
  allPosts: BlogPost[];
  /** All notes (for slug collision checks and embeds). */
  allNotes: NoteItem[];
  /** All books (for slug collision checks and embeds). */
  allBooks: BookItem[];
  /** Media items for the media picker. */
  mediaItems: MediaItem[];
  /** Callback after save succeeds: parent should update its list. */
  onSaved: (post: BlogPost, oldSlug?: string) => void;
  /** Callback when the modal is closed (cancel or after save). */
  onClose: () => void;
  /** Toast notification helper. */
  showToast: (msg: string) => void;
}

/**
 * Self-contained post editor modal. All editor state lives here so that
 * typing never causes the parent ContentManager to re-render.
 */
export function PostEditorModal({
  editingPost,
  allPosts,
  allNotes,
  allBooks,
  mediaItems,
  onSaved,
  onClose,
  showToast,
}: PostEditorModalProps) {
  const [isPending, startTransition] = useTransition();

  // All post metadata state lives here, not in ContentManager.
  const [title, setTitle] = useState(editingPost?.title ?? '');
  const [slug, setSlug] = useState(editingPost?.slug ?? '');
  const [description, setDescription] = useState(editingPost?.description ?? '');
  const [persona, setPersona] = useState<Persona>('builder');
  const [status, setStatus] = useState<'published' | 'unpublished'>(
    editingPost?.status ?? 'published',
  );
  const [tagsInput, setTagsInput] = useState(
    editingPost ? editingPost.tags.join(', ') : 'craft, software, tools',
  );
  const [publishedAt, setPublishedAt] = useState(
    editingPost?.publishedAt ?? new Date().toISOString().split('T')[0],
  );
  const [lastEditedAt, setLastEditedAt] = useState(
    editingPost?.lastEditedAt ?? new Date().toISOString().split('T')[0],
  );
  const [targetAudience, setTargetAudience] = useState(
    editingPost?.targetAudience ?? 'Curious technologists and builders',
  );
  const [mdxContent, setMdxContent] = useState(
    editingPost
      ? sectionsToMarkdown(editingPost.intro, editingPost.sections)
      : defaultPostContent(),
  );

  const hasChanges = Boolean(
    editingPost &&
      (title !== editingPost.title ||
        slug !== editingPost.slug ||
        description !== editingPost.description ||
        tagsInput !== editingPost.tags.join(', ') ||
        publishedAt !== (editingPost.publishedAt || '') ||
        lastEditedAt !== (editingPost.lastEditedAt || '') ||
        targetAudience !== (editingPost.targetAudience || '') ||
        status !== (editingPost.status || 'published') ||
        mdxContent !== sectionsToMarkdown(editingPost.intro, editingPost.sections)),
  );

  function handleDiscard() {
    if (!editingPost) return;
    setTitle(editingPost.title);
    setSlug(editingPost.slug);
    setDescription(editingPost.description);
    setPersona('builder');
    setStatus(editingPost.status || 'published');
    setTagsInput(editingPost.tags.join(', '));
    setPublishedAt(editingPost.publishedAt || new Date().toISOString().split('T')[0]);
    setLastEditedAt(editingPost.lastEditedAt || new Date().toISOString().split('T')[0]);
    setTargetAudience(editingPost.targetAudience || 'Curious technologists and builders');
    setMdxContent(sectionsToMarkdown(editingPost.intro, editingPost.sections));
    showToast(`Unpublished changes discarded for "${editingPost.title}". Reverted to published version.`);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanSlug = slugify(slug || title || 'untitled-essay');
    const isTakenByPost = allPosts.some(
      (p) => p.slug === cleanSlug && p.slug !== editingPost?.slug,
    );
    const isTakenByNote = allNotes.some((n) => n.slug === cleanSlug);
    const isTakenByBook = allBooks.some((b) => b.slug === cleanSlug);
    if (isTakenByPost || isTakenByNote || isTakenByBook) {
      showToast(
        `Slug "${cleanSlug}" is already in use. Please choose a unique slug.`,
      );
      return;
    }

    const { intro, sections } = markdownToPostSections(mdxContent);

    const postPayload: BlogPost = {
      title,
      slug: cleanSlug,
      description:
        description || (intro[0] ? intro[0].slice(0, 150) : title),
      tags: parsedTags.length > 0 ? parsedTags : ['essay'],
      publishedAt: publishedAt || new Date().toISOString().split('T')[0],
      lastEditedAt: lastEditedAt || new Date().toISOString().split('T')[0],
      targetAudience,
      intro: intro.length > 0 ? intro : [description],
      sections:
        sections.length > 0
          ? sections
          : [
              {
                id: 'section-1',
                heading: 'Overview',
                paragraphs: [mdxContent || ''],
              },
            ],
      books: editingPost?.books || [],
      status,
    };

    const oldSlug = editingPost?.slug;

    startTransition(async () => {
      if (editingPost && editingPost.slug !== cleanSlug) {
        await deletePostAction(editingPost.slug);
      }
      const res = await savePostAction(postPayload, persona);
      if (res.success && res.post) {
        onSaved(postPayload, oldSlug);
        showToast(`Essay "${title}" saved successfully with MDX!`);
      } else {
        showToast(res.error || 'Failed to save post');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6 backdrop-blur-xs">
      <div className="relative my-4 max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-tinted/20 bg-night p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-tinted/20 pb-4">
          <div>
            <h3 className="font-serif text-2xl font-normal text-paper">
              {editingPost ? 'Edit Post' : 'New Post'}
            </h3>
            <p className="mt-0.5 text-xs text-gray-mid">
              Author long-form essays with live split-view markdown and rich
              component insertions.
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
          {/* Metadata row: Title & Slug */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-title" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Title
              </label>
              <input
                id="post-title"
                type="text"
                required
                placeholder="Essay Title..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingPost && !slug) {
                    setSlug(slugify(e.target.value));
                  }
                }}
                className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="post-slug" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Slug
              </label>
              <input
                id="post-slug"
                type="text"
                required
                placeholder="essay-slug-url"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 font-mono text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Persona, Status, Dates & Tags row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="post-status" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Status
              </label>
              <select
                id="post-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'published' | 'unpublished')
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
              <label htmlFor="post-persona" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Persona Theme
              </label>
              <select
                id="post-persona"
                value={persona}
                onChange={(e) => setPersona(e.target.value as Persona)}
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
              <label htmlFor="post-published-date" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Published Date
              </label>
              <input
                id="post-published-date"
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-xs text-paper focus:border-tinted/40 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="post-tags" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Tags
              </label>
              <input
                id="post-tags"
                type="text"
                placeholder="craft, tools, web"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-xs text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Summary / Excerpt */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
              Summary / Excerpt
            </label>
            <input
              type="text"
              placeholder="Short one-line synopsis for cards..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
            />
          </div>

          {/* Rich MDX Editor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid mb-1.5">
              Essay Body (Markdown & MDX)
            </label>
            <MDXEditor
              initialContent={mdxContent}
              title={title}
              subtitle={description}
              persona={persona}
              date={publishedAt}
              mediaItems={mediaItems}
              embedBooks={allBooks}
              embedPosts={allPosts}
              embedNotes={allNotes}
              onChange={(val) => setMdxContent(val)}
              className="h-[520px]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-tinted/20">
            <div>
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-800/40 bg-rose-950/20 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/50 transition-colors"
                  title="Discard unpublished modifications"
                >
                  <span>↺</span>
                  <span>Discard Changes</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
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
                {isPending ? 'Saving Essay...' : 'Save Essay'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function defaultPostContent(): string {
  return (
    'An opening reflection on tools, craft, and technology.\n\n' +
    '## First Principle\n\n' +
    'We often build digital things quickly before understanding their long-term impact on our attention.\n\n' +
    '> [!NOTE]\n> Taking the slower path usually yields more resilient systems.\n\n' +
    '## The Architecture of Quiet Spaces\n\n' +
    'Software should feel like an orderly workshop, not a crowded marketplace.'
  );
}
