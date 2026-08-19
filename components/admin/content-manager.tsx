'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { BlogPost, MediaItem, NoteItem, Persona, PostSection } from '@/lib/types';
import {
  savePostAction,
  deletePostAction,
  togglePostStatusAction,
  saveNoteAction,
  deleteNoteAction,
  toggleNoteStatusAction,
} from '@/app/admin/actions';
import { MDXEditor } from './mdx-editor/mdx-editor';

interface ContentManagerProps {
  initialPosts: BlogPost[];
  initialNotes: NoteItem[];
  mediaItems?: MediaItem[];
}

type ContentFilterType = 'all' | 'post' | 'note';
type StatusFilterType = 'all' | 'published' | 'unpublished';
type PersonaFilterType = 'all' | Persona;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts post sections and intro into an MDX markdown string.
 */
function sectionsToMarkdown(intro: string[], sections: PostSection[]): string {
  const parts: string[] = [];
  if (intro && intro.length > 0) {
    parts.push(intro.join('\n\n'));
  }
  if (sections && sections.length > 0) {
    sections.forEach((sec) => {
      parts.push(`## ${sec.heading}`);
      if (sec.paragraphs && sec.paragraphs.length > 0) {
        parts.push(sec.paragraphs.join('\n\n'));
      }
      if (sec.figure) {
        parts.push(`![${sec.figure.alt}](${sec.figure.src})\n*${sec.figure.caption}*`);
      }
      if (sec.quote) {
        parts.push(`> ${sec.quote.text}\n> — ${sec.quote.attribution || ''}`);
      }
      if (sec.footnotes && sec.footnotes.length > 0) {
        sec.footnotes.forEach((fn, idx) => {
          parts.push(`[^${idx + 1}]: ${fn}`);
        });
      }
    });
  }
  return parts.join('\n\n');
}

/**
 * Converts MDX markdown string back into structured PostSections and intro.
 */
function markdownToPostSections(md: string): { intro: string[]; sections: PostSection[] } {
  if (!md || !md.trim()) {
    return { intro: [], sections: [] };
  }

  // Split by H2 headers (## Heading)
  const parts = md.split(/^##\s+/m);
  const introText = parts[0]?.trim() || '';
  const intro = introText ? introText.split('\n\n').filter(Boolean) : [];

  const sections: PostSection[] = [];
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const firstNewline = chunk.indexOf('\n');
    const heading = (firstNewline > -1 ? chunk.slice(0, firstNewline) : chunk).trim();
    const body = firstNewline > -1 ? chunk.slice(firstNewline).trim() : '';

    // Extract footnote definitions: [^1]: text
    const footnotes: string[] = [];
    const bodyLines = body.split('\n');
    const contentLines: string[] = [];
    for (const line of bodyLines) {
      const fnMatch = line.trim().match(/^\[\^(\d+)\]:\s*(.+)/);
      if (fnMatch) {
        footnotes[Number(fnMatch[1]) - 1] = fnMatch[2];
      } else {
        contentLines.push(line);
      }
    }

    const paragraphs = contentLines.join('\n').split('\n\n').filter(Boolean);

    sections.push({
      id: slugify(heading) || `section-${i}`,
      heading: heading || `Section ${i}`,
      paragraphs: paragraphs.length > 0 ? paragraphs : [''],
      ...(footnotes.length > 0 ? { footnotes } : {}),
    });
  }

  return { intro, sections };
}

export function ContentManager({
  initialPosts,
  initialNotes,
  mediaItems = [],
}: ContentManagerProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentFilterType>('all');
  const [personaFilter, setPersonaFilter] = useState<PersonaFilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');

  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    kind: 'post' | 'note';
    slug: string;
    title: string;
  } | null>(null);

  // Post Editor State
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postSlug, setPostSlug] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postPersona, setPostPersona] = useState<Persona>('builder');
  const [postStatus, setPostStatus] = useState<'published' | 'unpublished'>('published');
  const [postTagsInput, setPostTagsInput] = useState('');
  const [postPlantedAt, setPostPlantedAt] = useState('');
  const [postLastTendedAt, setPostLastTendedAt] = useState('');
  const [postAssumedAudience, setPostAssumedAudience] = useState('');
  const [postMdxContent, setPostMdxContent] = useState('');

  // Note Editor State
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSlug, setNoteSlug] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [notePersona, setNotePersona] = useState<Persona>('thinker');
  const [noteStatus, setNoteStatus] = useState<'published' | 'unpublished'>('published');
  const [noteTagsInput, setNoteTagsInput] = useState('');
  const [noteMdxContent, setNoteMdxContent] = useState('');

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Post Handlers
  function handleOpenCreatePost() {
    setEditingPost(null);
    setPostTitle('');
    setPostSlug('');
    setPostDescription('');
    setPostPersona('builder');
    setPostStatus('published');
    setPostTagsInput('craft, software, tools');
    setPostPlantedAt(new Date().toISOString().split('T')[0]);
    setPostLastTendedAt(new Date().toISOString().split('T')[0]);
    setPostAssumedAudience('Curious technologists and builders');
    setPostMdxContent(
      'An opening reflection on tools, craft, and technology.\n\n## First Principle\n\nWe often build digital things quickly before understanding their long-term impact on our attention.\n\n> [!NOTE]\n> Taking the slower path usually yields more resilient systems.\n\n## The Architecture of Quiet Spaces\n\nSoftware should feel like an orderly workshop, not a crowded marketplace.'
    );
    setIsEditingPost(true);
  }

  function handleOpenEditPost(post: BlogPost) {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostSlug(post.slug);
    setPostDescription(post.description);
    setPostPersona('builder');
    setPostStatus(post.status || 'published');
    setPostTagsInput(post.tags.join(', '));
    setPostPlantedAt(post.plantedAt);
    setPostLastTendedAt(post.lastTendedAt);
    setPostAssumedAudience(post.assumedAudience || '');
    setPostMdxContent(sectionsToMarkdown(post.intro, post.sections));
    setIsEditingPost(true);
  }

  function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postTitle.trim() || !postSlug.trim()) return;

    const parsedTags = postTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const { intro, sections } = markdownToPostSections(postMdxContent);

    const postPayload: BlogPost = {
      title: postTitle,
      slug: slugify(postSlug),
      description: postDescription || (intro[0] ? intro[0].slice(0, 150) : postTitle),
      tags: parsedTags.length > 0 ? parsedTags : ['essay'],
      plantedAt: postPlantedAt || new Date().toISOString().split('T')[0],
      lastTendedAt: postLastTendedAt || new Date().toISOString().split('T')[0],
      assumedAudience: postAssumedAudience,
      intro: intro.length > 0 ? intro : [postDescription],
      sections: sections.length > 0 ? sections : [
        {
          id: 'section-1',
          heading: 'Overview',
          paragraphs: [postMdxContent || ''],
        }
      ],
      books: editingPost?.books || [],
      status: postStatus,
    };

    startTransition(async () => {
      const res = await savePostAction(postPayload, postPersona);
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
        setIsEditingPost(false);
        showToast(`Essay "${postTitle}" saved successfully with MDX!`);
      } else {
        showToast(res.error || 'Failed to save post');
      }
    });
  }

  function handleTogglePostStatus(slug: string) {
    startTransition(async () => {
      const res = await togglePostStatusAction(slug);
      if (res.success && res.post) {
        setPosts((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, status: res.post!.status } : p))
        );
        showToast(
          `Essay is now ${
            res.post.status === 'unpublished' ? 'Unpublished (Draft)' : 'Published'
          }.`
        );
      } else {
        showToast(res.error || 'Failed to toggle status');
      }
    });
  }

  // Note Handlers
  function handleOpenCreateNote() {
    setEditingNote(null);
    setNoteTitle('');
    setNoteSlug('');
    setNoteDescription('');
    setNoteDate(new Date().toISOString().split('T')[0]);
    setNotePersona('thinker');
    setNoteStatus('published');
    setNoteTagsInput('notes, thoughts');
    setNoteMdxContent(
      'An atomic thought or brief observation.\n\n> [!TIP]\n> Keep notes focused on a single coherent idea.'
    );
    setIsEditingNote(true);
  }

  function handleOpenEditNote(note: NoteItem) {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteSlug(note.slug);
    setNoteDescription(note.description);
    setNoteDate(note.date);
    setNotePersona(note.persona);
    setNoteStatus(note.status || 'published');
    setNoteTagsInput(note.tags.join(', '));
    setNoteMdxContent(note.content.join('\n\n'));
    setIsEditingNote(true);
  }

  function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTitle.trim() || !noteSlug.trim()) return;

    const parsedTags = noteTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const parsedParagraphs = noteMdxContent
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const notePayload: NoteItem = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      title: noteTitle,
      slug: slugify(noteSlug),
      description: noteDescription || (parsedParagraphs[0] ? parsedParagraphs[0].slice(0, 120) : noteTitle),
      content: parsedParagraphs.length > 0 ? parsedParagraphs : [noteDescription],
      date: noteDate || new Date().toISOString().split('T')[0],
      persona: notePersona,
      tags: parsedTags.length > 0 ? parsedTags : ['note'],
      status: noteStatus,
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
        setIsEditingNote(false);
        showToast(`Note "${noteTitle}" saved successfully!`);
      } else {
        showToast(res.error || 'Failed to save note');
      }
    });
  }

  function handleToggleNoteStatus(slug: string) {
    startTransition(async () => {
      const res = await toggleNoteStatusAction(slug);
      if (res.success && res.note) {
        setNotes((prev) =>
          prev.map((n) => (n.slug === slug ? { ...n, status: res.note!.status } : n))
        );
        showToast(
          `Note is now ${
            res.note.status === 'unpublished' ? 'Unpublished (Draft)' : 'Published'
          }.`
        );
      } else {
        showToast(res.error || 'Failed to toggle status');
      }
    });
  }

  // Delete Action
  function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    const { kind, slug } = deleteConfirm;

    startTransition(async () => {
      if (kind === 'post') {
        const res = await deletePostAction(slug);
        if (res.success) {
          setPosts((prev) => prev.filter((p) => p.slug !== slug));
          setDeleteConfirm(null);
          showToast('Essay deleted successfully');
        } else {
          showToast(res.error || 'Failed to delete essay');
        }
      } else {
        const res = await deleteNoteAction(slug);
        if (res.success) {
          setNotes((prev) => prev.filter((n) => n.slug !== slug));
          setDeleteConfirm(null);
          showToast('Note deleted successfully');
        } else {
          showToast(res.error || 'Failed to delete note');
        }
      }
    });
  }

  // Build unified items list
  const unifiedItems = [
    ...posts.map((p) => ({
      kind: 'post' as const,
      id: `post-${p.slug}`,
      slug: p.slug,
      title: p.title,
      date: p.plantedAt,
      persona: ('builder' as Persona),
      status: p.status || 'published',
      rawPost: p,
      rawNote: undefined,
    })),
    ...notes.map((n) => ({
      kind: 'note' as const,
      id: n.id || `note-${n.slug}`,
      slug: n.slug,
      title: n.title,
      date: n.date,
      persona: n.persona,
      status: n.status || 'published',
      rawPost: undefined,
      rawNote: n,
    })),
  ];

  // Sort by date descending
  unifiedItems.sort((a, b) => b.date.localeCompare(a.date));

  // Filter unified items
  const filteredItems = unifiedItems.filter((item) => {
    if (typeFilter !== 'all' && item.kind !== typeFilter) return false;
    if (personaFilter !== 'all' && item.persona !== personaFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSlug = item.slug.toLowerCase().includes(q);
      const matchPersona = item.persona.toLowerCase().includes(q);
      return matchTitle || matchSlug || matchPersona;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-cream shadow-xl ring-1 ring-tinted animate-in fade-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-normal text-ink md:text-3xl">
            Posts & Notes
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/compose?type=note"
            className="inline-flex items-center gap-1.5 rounded-full border border-tinted bg-cream px-4 py-2 text-xs font-semibold text-ink shadow-2xs transition-colors hover:bg-paper"
          >
            <span>+ New Note</span>
          </Link>

          <Link
            href="/admin/compose?type=post"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-xs font-semibold text-cream shadow-sm transition-colors hover:bg-accent"
          >
            <span>+ Full Page Composer (MDX)</span>
          </Link>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by title, slug, or persona..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-tinted bg-cream px-4 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ContentFilterType)}
          className="rounded-full border border-tinted bg-cream px-3.5 py-2 text-xs font-medium text-ink focus:border-ink focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="post">Essays ({posts.length})</option>
          <option value="note">Notes ({notes.length})</option>
        </select>

        {/* Persona Filter */}
        <select
          value={personaFilter}
          onChange={(e) => setPersonaFilter(e.target.value as PersonaFilterType)}
          className="rounded-full border border-tinted bg-cream px-3.5 py-2 text-xs font-medium text-ink focus:border-ink focus:outline-none"
        >
          <option value="all">All Personas</option>
          <option value="builder">Builder</option>
          <option value="operator">Operator</option>
          <option value="thinker">Thinker</option>
          <option value="wanderer">Wanderer</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
          className="rounded-full border border-tinted bg-cream px-3.5 py-2 text-xs font-medium text-ink focus:border-ink focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
      </div>

      {/* Unified Content Table */}
      <div className="overflow-hidden rounded-2xl border border-tinted bg-cream shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-tinted bg-paper/60 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Persona</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tinted/60">
              {filteredItems.map((item) => {
                const isPublished = item.status !== 'unpublished';
                const linkHref =
                  item.kind === 'post'
                    ? `/p/${item.slug}`
                    : `/n/${item.slug}`;

                return (
                  <tr key={item.id} className="transition-colors hover:bg-paper/40">
                    {/* Title */}
                    <td className="px-5 py-4">
                      <div className="font-serif text-base font-medium text-ink">
                        {item.title}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                          item.kind === 'post'
                            ? 'bg-ink text-cream'
                            : 'bg-paper text-ink-soft ring-1 ring-tinted'
                        }`}
                      >
                        {item.kind === 'post' ? 'Essay' : 'Note'}
                      </span>
                    </td>

                    {/* Persona */}
                    <td className="px-4 py-4 text-xs whitespace-nowrap">
                      <span className="capitalize text-ink-soft font-medium">
                        {item.persona}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-xs text-ink-soft whitespace-nowrap">
                      {item.date}
                    </td>

                    {/* Status */}
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

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {isPublished ? (
                          <>
                            <Link
                              href={linkHref}
                              target="_blank"
                              className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink-soft shadow-xs ring-1 ring-tinted transition-colors hover:text-ink hover:bg-cream"
                            >
                              View ↗
                            </Link>
                            <Link
                              href={`/admin/compose?slug=${item.slug}&type=${item.kind}`}
                              className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink shadow-xs ring-1 ring-tinted transition-colors hover:bg-ink hover:text-cream"
                            >
                              Edit (MDX)
                            </Link>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                if (item.kind === 'post') {
                                  handleTogglePostStatus(item.slug);
                                } else {
                                  handleToggleNoteStatus(item.slug);
                                }
                              }}
                              className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-amber-800 shadow-xs ring-1 ring-amber-200 transition-colors hover:bg-amber-100"
                            >
                              Unpublish
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirm({
                                  kind: item.kind,
                                  slug: item.slug,
                                  title: item.title,
                                })
                              }
                              className="rounded-full px-2.5 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={linkHref}
                              target="_blank"
                              className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink-soft shadow-xs ring-1 ring-tinted transition-colors hover:text-ink hover:bg-cream"
                            >
                              Preview ↗
                            </Link>
                            <Link
                              href={`/admin/compose?slug=${item.slug}&type=${item.kind}`}
                              className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink shadow-xs ring-1 ring-tinted transition-colors hover:bg-ink hover:text-cream"
                            >
                              Edit (MDX)
                            </Link>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                if (item.kind === 'post') {
                                  handleTogglePostStatus(item.slug);
                                } else {
                                  handleToggleNoteStatus(item.slug);
                                }
                              }}
                              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-xs ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
                            >
                              Publish
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirm({
                                  kind: item.kind,
                                  slug: item.slug,
                                  title: item.title,
                                })
                              }
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
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-soft">
                    No entries match your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-tinted bg-paper p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-serif text-xl font-normal text-ink">
              Delete {deleteConfirm.kind === 'post' ? 'Essay' : 'Note'}?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Are you sure you want to delete <b className="text-ink">{deleteConfirm.title}</b>? This action cannot be undone.
            </p>
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
                disabled={isPending}
                onClick={handleDeleteConfirm}
                className="rounded-full bg-red-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-800 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Essay Composer Modal with MDX Editor */}
      {isEditingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6 backdrop-blur-xs">
          <div className="relative my-4 max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-tinted bg-paper p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-tinted pb-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-ink">
                  {editingPost ? 'Edit Essay (MDX)' : 'Compose New Essay (MDX)'}
                </h3>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Author long-form essays with live split-view markdown and rich component insertions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPost(false)}
                className="rounded-full p-2 text-ink-soft hover:bg-cream hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePost} className="mt-6 space-y-6">
              {/* Metadata row: Title & Slug */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Essay Title..."
                    value={postTitle}
                    onChange={(e) => {
                      setPostTitle(e.target.value);
                      if (!editingPost && !postSlug) {
                        setPostSlug(slugify(e.target.value));
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
                    value={postSlug}
                    onChange={(e) => setPostSlug(slugify(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              {/* Persona, Status, Dates & Tags row */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Status
                  </label>
                  <select
                    value={postStatus}
                    onChange={(e) => setPostStatus(e.target.value as 'published' | 'unpublished')}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-xs text-ink focus:border-ink focus:outline-none"
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
                    value={postPersona}
                    onChange={(e) => setPostPersona(e.target.value as Persona)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="builder">Builder</option>
                    <option value="operator">Operator</option>
                    <option value="thinker">Thinker</option>
                    <option value="wanderer">Wanderer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Planted Date
                  </label>
                  <input
                    type="date"
                    value={postPlantedAt}
                    onChange={(e) => setPostPlantedAt(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="craft, tools, web"
                    value={postTagsInput}
                    onChange={(e) => setPostTagsInput(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              {/* Summary / Excerpt */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Summary / Excerpt
                </label>
                <input
                  type="text"
                  placeholder="Short one-line synopsis for cards..."
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              {/* Rich MDX Editor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                  Essay Body (Markdown & MDX)
                </label>
                <MDXEditor
                  initialContent={postMdxContent}
                  title={postTitle}
                  subtitle={postDescription}
                  persona={postPersona}
                  date={postPlantedAt}
                  mediaItems={mediaItems}
                  onChange={(val) => setPostMdxContent(val)}
                  className="h-[520px]"
                />
              </div>

              {/* Form Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-tinted">
                <button
                  type="button"
                  onClick={() => setIsEditingPost(false)}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-cream shadow-sm hover:bg-accent disabled:opacity-50"
                >
                  {isPending ? 'Saving Essay...' : 'Save Essay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Composer Modal with MDX Editor */}
      {isEditingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6 backdrop-blur-xs">
          <div className="relative my-4 max-h-[96vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-tinted bg-paper p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-tinted pb-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-ink">
                  {editingNote ? 'Edit Note (MDX)' : 'Create New Note (MDX)'}
                </h3>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Capture an atomic thought or observation with live MDX preview.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingNote(false)}
                className="rounded-full p-2 text-ink-soft hover:bg-cream hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="mt-6 space-y-6">
              {/* Metadata: Title, Slug, Status, Persona */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Note title..."
                    value={noteTitle}
                    onChange={(e) => {
                      setNoteTitle(e.target.value);
                      if (!editingNote && !noteSlug) {
                        setNoteSlug(slugify(e.target.value));
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
                    value={noteSlug}
                    onChange={(e) => setNoteSlug(slugify(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Status
                  </label>
                  <select
                    value={noteStatus}
                    onChange={(e) => setNoteStatus(e.target.value as 'published' | 'unpublished')}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-xs text-ink focus:border-ink focus:outline-none"
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
                    value={notePersona}
                    onChange={(e) => setNotePersona(e.target.value as Persona)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="builder">Builder</option>
                    <option value="operator">Operator</option>
                    <option value="thinker">Thinker</option>
                    <option value="wanderer">Wanderer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Date
                  </label>
                  <input
                    type="date"
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="philosophy, web"
                    value={noteTagsInput}
                    onChange={(e) => setNoteTagsInput(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              {/* MDX Note Editor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                  Note Content (Markdown & MDX)
                </label>
                <MDXEditor
                  initialContent={noteMdxContent}
                  title={noteTitle}
                  subtitle={noteDescription}
                  persona={notePersona}
                  date={noteDate}
                  mediaItems={mediaItems}
                  onChange={(val) => setNoteMdxContent(val)}
                  className="h-[440px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-tinted">
                <button
                  type="button"
                  onClick={() => setIsEditingNote(false)}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-cream shadow-sm hover:bg-accent disabled:opacity-50"
                >
                  {isPending ? 'Saving Note...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
