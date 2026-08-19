'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { BlogPost, Persona, PostSection } from '@/lib/types';
import {
  savePostAction,
  deletePostAction,
  togglePostStatusAction,
} from '@/app/admin/actions';

interface PostsManagerProps {
  initialPosts: BlogPost[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function PostsManager({ initialPosts }: PostsManagerProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [persona, setPersona] = useState<Persona>('builder');
  const [status, setStatus] = useState<'published' | 'unpublished'>('published');
  const [tagsInput, setTagsInput] = useState('');
  const [plantedAt, setPlantedAt] = useState('');
  const [lastTendedAt, setLastTendedAt] = useState('');
  const [assumedAudience, setAssumedAudience] = useState('');
  const [introText, setIntroText] = useState('');
  const [sections, setSections] = useState<PostSection[]>([]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function handleOpenCreate() {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setPersona('builder');
    setStatus('published');
    setTagsInput('craft, web');
    setPlantedAt(new Date().toISOString().split('T')[0]);
    setLastTendedAt(new Date().toISOString().split('T')[0]);
    setAssumedAudience('Curious technologists and builders');
    setIntroText('An essay exploring how we relate to modern digital tools.');
    setSections([
      {
        id: 'section-1',
        heading: 'The First Principle',
        paragraphs: [
          'We often build digital things quickly before understanding the long-term impact on our attention.',
          'Taking the slower path usually yields more resilient systems.',
        ],
      },
    ]);
    setIsEditing(true);
  }

  function handleOpenEdit(post: BlogPost) {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setDescription(post.description);
    setPersona('builder');
    setStatus(post.status || 'published');
    setTagsInput(post.tags.join(', '));
    setPlantedAt(post.plantedAt);
    setLastTendedAt(post.lastTendedAt);
    setAssumedAudience(post.assumedAudience || '');
    setIntroText(post.intro.join('\n\n'));
    setSections(post.sections.length > 0 ? post.sections : []);
    setIsEditing(true);
  }

  function handleAddSection() {
    const newId = `section-${sections.length + 1}`;
    setSections([
      ...sections,
      {
        id: newId,
        heading: `Section ${sections.length + 1}`,
        paragraphs: ['Write paragraph content here...'],
      },
    ]);
  }

  function handleUpdateSectionHeading(index: number, val: string) {
    const next = [...sections];
    next[index] = {
      ...next[index],
      heading: val,
      id: slugify(val) || `section-${index + 1}`,
    };
    setSections(next);
  }

  function handleUpdateSectionParagraphs(index: number, val: string) {
    const next = [...sections];
    next[index] = {
      ...next[index],
      paragraphs: val.split('\n\n').filter((p) => p.trim().length > 0),
    };
    setSections(next);
  }

  function handleDeleteSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function handleToggleStatus(postSlug: string) {
    startTransition(async () => {
      const res = await togglePostStatusAction(postSlug);
      if (res.success && res.post) {
        setPosts((prev) =>
          prev.map((p) => (p.slug === postSlug ? { ...p, status: res.post!.status } : p))
        );
        showToast(
          `Essay "${res.post.title}" is now ${
            res.post.status === 'unpublished' ? 'Unpublished (Draft)' : 'Published'
          }.`
        );
      } else {
        showToast(res.error || 'Failed to toggle status');
      }
    });
  }

  function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const parsedIntro = introText
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const postPayload: BlogPost = {
      title,
      slug: slugify(slug),
      description,
      tags: parsedTags.length > 0 ? parsedTags : ['essay'],
      plantedAt: plantedAt || new Date().toISOString().split('T')[0],
      lastTendedAt: lastTendedAt || new Date().toISOString().split('T')[0],
      assumedAudience,
      intro: parsedIntro.length > 0 ? parsedIntro : [description],
      sections,
      books: editingPost?.books || [],
      status,
    };

    startTransition(async () => {
      const res = await savePostAction(postPayload, persona);
      if (res.success && res.post) {
        setPosts((prev) => {
          const idx = prev.findIndex((p) => p.slug === postPayload.slug);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = postPayload;
            return copy;
          }
          return [postPayload, ...prev];
        });
        setIsEditing(false);
        showToast(`Post "${title}" saved successfully!`);
      } else {
        showToast(res.error || 'Failed to save post');
      }
    });
  }

  function handleDeletePost(slugToDelete: string) {
    startTransition(async () => {
      const res = await deletePostAction(slugToDelete);
      if (res.success) {
        setPosts((prev) => prev.filter((p) => p.slug !== slugToDelete));
        setDeleteConfirmSlug(null);
        showToast('Post deleted successfully');
      } else {
        showToast(res.error || 'Failed to delete post');
      }
    });
  }

  const filteredPosts = posts.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
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
            Posts & Long-form Essays
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Manage long-form articles, publication status, and sections ({posts.length} total).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-accent"
        >
          <span>+ New Essay</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search posts by title, tag, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-tinted bg-cream px-4 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      {/* Posts Table */}
      <div className="overflow-hidden rounded-2xl border border-tinted bg-cream shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-tinted bg-paper/60 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tinted/60">
              {filteredPosts.map((post) => {
                const isPublished = post.status !== 'unpublished';

                return (
                  <tr key={post.slug} className="transition-colors hover:bg-paper/40">
                    <td className="px-5 py-4">
                      <div className="font-serif text-base font-medium text-ink">
                        {post.title}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-ink-soft whitespace-nowrap">
                      {post.plantedAt}
                    </td>
                    <td className="px-4 py-4 text-xs whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                            : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isPublished ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                        />
                        {isPublished ? 'Published' : 'Unpublished'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {isPublished ? (
                          <>
                            <Link
                              href={`/p/${post.slug}`}
                              target="_blank"
                              className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink-soft shadow-xs ring-1 ring-tinted transition-colors hover:text-ink hover:bg-cream"
                            >
                              View ↗
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(post)}
                              className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink shadow-xs ring-1 ring-tinted transition-colors hover:bg-ink hover:text-cream"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleToggleStatus(post.slug)}
                              className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-amber-800 shadow-xs ring-1 ring-amber-200 transition-colors hover:bg-amber-100"
                            >
                              Unpublish
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmSlug(post.slug)}
                              className="rounded-full px-2.5 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/p/${post.slug}`}
                              target="_blank"
                              className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink-soft shadow-xs ring-1 ring-tinted transition-colors hover:text-ink hover:bg-cream"
                            >
                              Preview ↗
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(post)}
                              className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink shadow-xs ring-1 ring-tinted transition-colors hover:bg-ink hover:text-cream"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleToggleStatus(post.slug)}
                              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-xs ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
                            >
                              Publish
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmSlug(post.slug)}
                              className="rounded-full px-2.5 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-ink-soft">
                    No essays match that search query.
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
              Delete Essay?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Are you sure you want to delete <b className="text-ink">{deleteConfirmSlug}</b>? This action will remove the post from Scribble and Writing archives.
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
                onClick={() => handleDeletePost(deleteConfirmSlug)}
                className="rounded-full bg-red-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-800 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Essay Composer Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs sm:p-6">
          <div className="relative my-8 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-tinted bg-paper p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-tinted pb-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-ink">
                  {editingPost ? 'Edit Essay' : 'Compose New Essay'}
                </h3>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Fill in metadata, intro, and dynamic body sections.
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

            <form onSubmit={handleSavePost} className="mt-6 space-y-6">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Title
                  </label>
                  <input
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
                    placeholder="essay-slug-url"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Summary / Excerpt
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Short description shown on listing cards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full resize-none rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              {/* Persona, Status & Tags */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'published' | 'unpublished')}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished (Draft)</option>
                  </select>
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
                    placeholder="craft, software, tools"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates & Audience */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Planted Date
                  </label>
                  <input
                    type="date"
                    value={plantedAt}
                    onChange={(e) => setPlantedAt(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Last Tended Date
                  </label>
                  <input
                    type="date"
                    value={lastTendedAt}
                    onChange={(e) => setLastTendedAt(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Assumed Audience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Curious developers"
                    value={assumedAudience}
                    onChange={(e) => setAssumedAudience(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              {/* Intro paragraphs */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Intro Paragraphs (Separated by blank line)
                </label>
                <textarea
                  rows={4}
                  placeholder="Introductory text before the first section..."
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  className="mt-1.5 w-full resize-none rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              {/* Sections Builder */}
              <div className="space-y-4 rounded-2xl border border-tinted bg-cream/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Article Sections ({sections.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink ring-1 ring-tinted hover:bg-cream"
                  >
                    + Add Section
                  </button>
                </div>

                {sections.map((section, idx) => (
                  <div
                    key={section.id || idx}
                    className="space-y-3 rounded-xl border border-tinted bg-cream p-4 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        placeholder={`Section ${idx + 1} Heading...`}
                        value={section.heading}
                        onChange={(e) =>
                          handleUpdateSectionHeading(idx, e.target.value)
                        }
                        className="w-full rounded-lg border border-tinted bg-paper px-3 py-1.5 text-sm font-medium text-ink focus:border-ink focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(idx)}
                        className="text-xs font-medium text-red-700 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Paragraphs (separated by double newlines)..."
                      value={section.paragraphs.join('\n\n')}
                      onChange={(e) =>
                        handleUpdateSectionParagraphs(idx, e.target.value)
                      }
                      className="w-full resize-none rounded-lg border border-tinted bg-paper px-3 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Form Footer Buttons */}
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
                  {isPending ? 'Saving...' : 'Save Essay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
