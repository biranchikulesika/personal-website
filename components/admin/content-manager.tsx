"use client";

import {
  deleteBookAction,
  deleteNoteAction,
  deleteNowEntryAction,
  deletePostAction,
  saveBookAction,
  toggleBookStatusAction,
  toggleNoteStatusAction,
  togglePostStatusAction,
} from "@/app/admin/actions";
import {
  EllipsisVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";
import type {
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
  Persona,
} from "@/lib/types";
import {
  formatDisplayDate,
  slugify,
} from "@/lib/utils";
import Link from "next/link";
import { EmptyTableState } from "@/components/ui/states";
import { useState, useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastView } from "@/components/ui/toast-view";
import { BookCoverPicker } from "./book-cover-picker";
import { PostEditorModal } from "./mdx-editor/post-editor-modal";
import { NoteEditorModal } from "./mdx-editor/note-editor-modal";

interface ContentManagerProps {
  initialPosts: BlogPost[];
  initialNotes: NoteItem[];
  initialBooks?: BookItem[];
  initialNowEntries?: NowEntry[];
  mediaItems?: MediaItem[];
  openCreateBookTrigger?: number;
}

type ContentFilterType = "all" | "post" | "note" | "book" | "now";
type StatusFilterType = "all" | "published" | "unpublished";
type PersonaFilterType = "all" | Persona;

export function ContentManager({
  initialPosts,
  initialNotes,
  initialBooks = [],
  initialNowEntries = [],
  mediaItems = [],
  openCreateBookTrigger,
}: ContentManagerProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [books, setBooks] = useState<BookItem[]>(initialBooks);
  const [nowEntries, setNowEntries] = useState<NowEntry[]>(initialNowEntries);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentFilterType>("all");
  const [personaFilter, setPersonaFilter] = useState<PersonaFilterType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");

  const [isPending, startTransition] = useTransition();
  const { message: toastMessage, showToast } = useToast();

  // Three-dot action menu state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Close action menu on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpenId(null);
    }
    if (menuOpenId) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [menuOpenId]);

  useEffect(() => {
    if (openCreateBookTrigger && openCreateBookTrigger > 0) {
      handleOpenCreateBook();
    }
  }, [openCreateBookTrigger]);

  // Confirmation dialog state (publish / unpublish / delete)
  const [confirmAction, setConfirmAction] = useState<{
    kind: "post" | "note" | "book" | "now";
    action: "publish" | "unpublish" | "delete";
    slug: string;
    title: string;
  } | null>(null);

  // Type-to-confirm input for deletion
  const [confirmTypedTitle, setConfirmTypedTitle] = useState("");

  function openConfirmAction(confirm: {
    kind: "post" | "note" | "book" | "now";
    action: "publish" | "unpublish" | "delete";
    slug: string;
    title: string;
  }) {
    setConfirmTypedTitle("");
    setConfirmAction(confirm);
  }

  // Post Editor: only the open/close flag and which post is being edited.
  // All editor state lives inside PostEditorModal.
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Note Editor: same pattern as post.
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // Book Editor State
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [bookSlug, setBookSlug] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookPersona, setBookPersona] = useState<Persona>("thinker");
  const [bookTagsInput, setBookTagsInput] = useState("");
  const [bookCover, setBookCover] = useState("");
  const [bookLink, setBookLink] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);

  const availableMedia = [...uploadedMedia, ...mediaItems];

  function handleBookCoverUploaded(media: MediaItem) {
    setUploadedMedia((prev) =>
      prev.some((m) => m.src === media.src) ? prev : [media, ...prev],
    );
  }



  // Post open/create handlers: just set the flag and which post to edit.
  function handleOpenCreatePost() {
    setEditingPost(null);
    setIsEditingPost(true);
  }

  function handleOpenEditPost(post: BlogPost) {
    setEditingPost(post);
    setIsEditingPost(true);
  }

  // Post save callback: called by PostEditorModal after successful save.
  function handlePostSaved(post: BlogPost, oldSlug?: string) {
    setPosts((prev) => {
      const filtered = prev.filter(
        (p) => p.slug !== oldSlug && p.slug !== post.slug,
      );
      return [post, ...filtered];
    });
    setIsEditingPost(false);
  }

  // Note open/create handlers: just set the flag and which note to edit.
  function handleOpenCreateNote() {
    setEditingNote(null);
    setIsEditingNote(true);
  }

  function handleOpenEditNote(note: NoteItem) {
    setEditingNote(note);
    setIsEditingNote(true);
  }

  // Note save callback: called by NoteEditorModal after successful save.
  function handleNoteSaved(note: NoteItem, oldSlug?: string) {
    setNotes((prev) => {
      const filtered = prev.filter(
        (n) => n.slug !== oldSlug && n.slug !== note.slug,
      );
      return [note, ...filtered];
    });
    setIsEditingNote(false);
  }

  function handleToggleNoteStatus(slug: string) {
    startTransition(async () => {
      const res = await toggleNoteStatusAction(slug);
      if (res.success && res.note) {
        setNotes((prev) =>
          prev.map((n) =>
            n.slug === slug ? { ...n, status: res.note!.status } : n,
          ),
        );
        showToast(
          `Note is now ${
            res.note.status === "unpublished" ? "Draft" : "Published"
          }.`,
        );
      } else {
        showToast(res.error || "Failed to toggle status");
      }
    });
  }

  // Book Handlers
  function handleOpenCreateBook() {
    setEditingBook(null);
    setBookTitle("");
    setBookSlug("");
    setBookAuthor("");
    setBookDescription("");
    setBookDate(new Date().toISOString().split("T")[0]);
    setBookPersona("thinker");
    setBookTagsInput("");
    setBookCover("");
    setBookLink("");
    setIsEditingBook(true);
  }

  function handleOpenEditBook(book: BookItem) {
    setEditingBook(book);
    setBookTitle(book.title);
    setBookSlug(book.slug);
    setBookAuthor(book.author);
    setBookDescription(book.description);
    setBookDate(book.date);
    setBookPersona(book.persona);
    setBookTagsInput(book.tags.join(", "));
    setBookCover(book.cover || "");
    setBookLink(book.link || "");
    setIsEditingBook(true);
  }

  function handleSaveBookWithStatus(publish: boolean) {
    if (!bookTitle.trim() || !bookAuthor.trim()) {
      showToast("Book title and author are required.");
      return;
    }

    const cleanSlug = slugify(bookSlug || bookTitle || "untitled-book");
    const isTakenByBook = books.some(
      (b) => b.slug === cleanSlug && b.slug !== editingBook?.slug,
    );
    const isTakenByPost = posts.some((p) => p.slug === cleanSlug);
    const isTakenByNote = notes.some((n) => n.slug === cleanSlug);
    if (isTakenByBook || isTakenByPost || isTakenByNote) {
      showToast(
        `Slug "${cleanSlug}" is already in use. Please choose a unique slug.`,
      );
      return;
    }

    const parsedTags = bookTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const bookPayload: BookItem = {
      id: editingBook ? editingBook.id : `book-${Date.now()}`,
      title: bookTitle,
      author: bookAuthor,
      slug: cleanSlug,
      description: bookDescription,
      date: bookDate || new Date().toISOString().split("T")[0],
      persona: bookPersona,
      tags: parsedTags.length > 0 ? parsedTags : ["book"],
      cover: bookCover.trim() || undefined,
      link: bookLink.trim() || undefined,
      isPublished: publish,
      status: publish ? "published" : "unpublished",
    };

    startTransition(async () => {
      if (editingBook && editingBook.slug !== cleanSlug) {
        await deleteBookAction(editingBook.slug);
      }
      const res = await saveBookAction(bookPayload);
      if (res.success && res.book) {
        setBooks((prev) => {
          const filtered = prev.filter(
            (b) => b.slug !== editingBook?.slug && b.slug !== cleanSlug,
          );
          return [res.book!, ...filtered];
        });
        setIsEditingBook(false);
        showToast(
          publish
            ? `Book "${bookTitle}" published to library shelf!`
            : `Book "${bookTitle}" saved as draft!`,
        );
      } else {
        showToast(res.error || "Failed to save book");
      }
    });
  }

  function handleSaveBook(e: React.FormEvent) {
    e.preventDefault();
    const isCurrentlyPublished =
      editingBook ? editingBook.isPublished !== false && editingBook.status !== "unpublished" : true;
    handleSaveBookWithStatus(isCurrentlyPublished);
  }

  // Confirmation action handler (publish / unpublish / delete)
  function handleConfirmAction() {
    if (!confirmAction) return;
    const { kind, slug, action } = confirmAction;

    startTransition(async () => {
      if (action === "delete") {
        if (kind === "post") {
          const res = await deletePostAction(slug);
          if (res.success) {
            setPosts((prev) => prev.filter((p) => p.slug !== slug));
            setConfirmAction(null);
            showToast("Essay deleted successfully");
          } else {
            showToast(res.error || "Failed to delete essay");
          }
        } else if (kind === "note") {
          const res = await deleteNoteAction(slug);
          if (res.success) {
            setNotes((prev) => prev.filter((n) => n.slug !== slug));
            setConfirmAction(null);
            showToast("Note deleted successfully");
          } else {
            showToast(res.error || "Failed to delete note");
          }
        } else if (kind === "now") {
          const res = await deleteNowEntryAction(slug);
          if (res.success) {
            setNowEntries((prev) => prev.filter((e) => e.id !== slug));
            setConfirmAction(null);
            showToast("Now entry removed from the timeline");
          } else {
            showToast(res.error || "Failed to delete now entry");
          }
        } else {
          const res = await deleteBookAction(slug);
          if (res.success) {
            setBooks((prev) => prev.filter((b) => b.slug !== slug));
            setConfirmAction(null);
            showToast("Book removed from library");
          } else {
            showToast(res.error || "Failed to delete book");
          }
        }
      } else {
        if (kind === "post") {
          const res = await togglePostStatusAction(slug);
          if (res.success && res.post) {
            setPosts((prev) =>
              prev.map((p) =>
                p.slug === slug ? { ...p, status: res.post!.status } : p,
              ),
            );
            setConfirmAction(null);
            showToast(
              `Essay is now ${
                res.post.status === "unpublished" ? "Draft" : "Published"
              }.`,
            );
          } else {
            showToast(res.error || "Failed to toggle status");
          }
        } else if (kind === "book") {
          const res = await toggleBookStatusAction(slug);
          if (res.success && res.book) {
            setBooks((prev) =>
              prev.map((b) =>
                b.slug === slug
                  ? {
                      ...b,
                      isPublished: res.book!.isPublished,
                      status: res.book!.status,
                    }
                  : b,
              ),
            );
            setConfirmAction(null);
            showToast(
              `Book is now ${
                res.book.isPublished ? "Published" : "Draft"
              }.`,
            );
          } else {
            showToast(res.error || "Failed to toggle status");
          }
        } else {
          const res = await toggleNoteStatusAction(slug);
          if (res.success && res.note) {
            setNotes((prev) =>
              prev.map((n) =>
                n.slug === slug ? { ...n, status: res.note!.status } : n,
              ),
            );
            setConfirmAction(null);
            showToast(
              `Note is now ${
                res.note.status === "unpublished" ? "Draft" : "Published"
              }.`,
            );
          } else {
            showToast(res.error || "Failed to toggle status");
          }
        }
      }
    });
  }

  // Build unified items list
  const unifiedItems = [
    ...posts.map((p) => ({
      kind: "post" as const,
      id: `post-${p.slug}`,
      slug: p.slug,
      title: p.title,
      date: p.publishedAt,
      persona: "builder" as Persona,
      status: p.status || "published",
      rawPost: p,
      rawNote: undefined,
      rawBook: undefined,
      rawNow: undefined,
    })),
    ...notes.map((n) => ({
      kind: "note" as const,
      id: n.id || `note-${n.slug}`,
      slug: n.slug,
      title: n.title,
      date: n.date,
      persona: n.persona,
      status: n.status || "published",
      rawPost: undefined,
      rawNote: n,
      rawBook: undefined,
      rawNow: undefined,
    })),
    ...books.map((b) => ({
      kind: "book" as const,
      id: b.id || `book-${b.slug}`,
      slug: b.slug,
      title: b.title,
      date: b.date,
      persona: b.persona,
      status: (b.isPublished !== false && b.status !== "unpublished"
        ? "published"
        : "unpublished") as "published" | "unpublished",
      rawPost: undefined,
      rawNote: undefined,
      rawBook: b,
      rawNow: undefined,
    })),
    ...nowEntries.map((n) => ({
      kind: "now" as const,
      id: n.id,
      slug: n.slug || n.id,
      title: n.title,
      date: n.date || "",
      persona: undefined,
      status: undefined,
      rawPost: undefined,
      rawNote: undefined,
      rawBook: undefined,
      rawNow: n,
    })),
  ];

  // Sort by date descending
  unifiedItems.sort((a, b) => b.date.localeCompare(a.date));

  // Filter unified items
  const filteredItems = unifiedItems.filter((item) => {
    if (typeFilter !== "all" && item.kind !== typeFilter) return false;
    if (personaFilter !== "all" && item.persona !== personaFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSlug = item.slug.toLowerCase().includes(q);
      const matchPersona = item.persona
        ? item.persona.toLowerCase().includes(q)
        : false;
      const matchAuthor =
        item.kind === "book" && item.rawBook
          ? item.rawBook.author.toLowerCase().includes(q)
          : false;
      if (!(matchTitle || matchSlug || matchPersona || matchAuthor))
        return false;
    }

    if (item.kind === "now")
      return statusFilter === "all";
    if (statusFilter !== "all" && item.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <ToastView message={toastMessage} />

      {/* ── Mobile View (md:hidden) ── */}
      <div className="block md:hidden space-y-3">
        {/* Mobile Search Input at Top */}
        <input
          type="text"
          placeholder="Search by title, slug, or persona..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-tinted/20 bg-night-soft px-4 py-2 text-xs text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
        />

        {/* Mobile Filter Controls */}
        <div className="grid grid-cols-3 gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ContentFilterType)}
            className="w-full rounded-full border border-tinted/20 bg-night-soft px-3 py-1.5 text-xs font-medium text-paper focus:border-tinted/40 focus:outline-none truncate"
          >
            <option value="all" className="bg-night text-paper">
              All Types
            </option>
            <option value="post" className="bg-night text-paper">
              Essays ({posts.length})
            </option>
            <option value="note" className="bg-night text-paper">
              Notes ({notes.length})
            </option>
            <option value="book" className="bg-night text-paper">
              Books ({books.length})
            </option>
            <option value="now" className="bg-night text-paper">
              Now ({nowEntries.length})
            </option>
          </select>

          {/* Persona Filter */}
          <select
            value={personaFilter}
            onChange={(e) =>
              setPersonaFilter(e.target.value as PersonaFilterType)
            }
            className="w-full rounded-full border border-tinted/20 bg-night-soft px-3 py-1.5 text-xs font-medium text-paper focus:border-tinted/40 focus:outline-none truncate"
          >
            <option value="all" className="bg-night text-paper">
              All Personas
            </option>
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
            className="w-full rounded-full border border-tinted/20 bg-night-soft px-3 py-1.5 text-xs font-medium text-paper focus:border-tinted/40 focus:outline-none truncate"
          >
            <option value="all" className="bg-night text-paper">
              All Status
            </option>
            <option value="published" className="bg-night text-paper">
              Published
            </option>
            <option value="unpublished" className="bg-night text-paper">
              Draft
            </option>
          </select>
        </div>

        {/* Mobile Content List (No Box Wrap) */}
        <div className="divide-y divide-tinted/20">
          {filteredItems.map((item, rowIndex) => {
            const isBook = item.kind === "book";
            const isNow = item.kind === "now";
            const isPublished =
              !isBook && !isNow && item.status !== "unpublished";
            const linkHref =
              item.kind === "post"
                ? `/p/${item.slug}`
                : item.kind === "note"
                  ? `/n/${item.slug}`
                  : item.kind === "now"
                    ? "/now"
                    : "/library";

            return (
              <div
                key={`mob-${item.id}`}
                className="py-3.5 space-y-2.5"
              >
                {/* Header Badges: Type + Persona + Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        item.kind === "post"
                          ? "bg-accent text-paper"
                          : "bg-night-soft text-paper border border-tinted/20"
                      }`}
                    >
                      {item.kind === "post"
                        ? "Essay"
                        : item.kind === "note"
                          ? "Note"
                          : item.kind === "now"
                            ? "Now"
                            : "Book"}
                    </span>
                    {!isNow && item.persona && (
                      <span className="text-[10px] capitalize text-teal font-medium">
                        {item.persona}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isBook ? (
                      <span className="inline-flex items-center rounded-full bg-night-soft px-2 py-0.5 text-[10px] font-semibold text-gray-mid border border-tinted/20">
                        On Shelf
                      </span>
                    ) : isNow ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          rowIndex === 0
                            ? "bg-sea-blue/20 text-sea-blue border border-sea-blue/30"
                            : "bg-night-soft text-gray-mid border border-tinted/20"
                        }`}
                      >
                        {rowIndex === 0 ? "Current" : "Past"}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isPublished
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                        }`}
                      >
                        {isPublished ? "Published" : "Draft"}
                      </span>
                    )}

                    {/* Mobile Action Menu */}
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        aria-label={`Actions for ${item.title}`}
                        aria-haspopup="true"
                        aria-expanded={menuOpenId === `mob-${item.id}`}
                        onClick={() =>
                          setMenuOpenId(
                            menuOpenId === `mob-${item.id}` ? null : `mob-${item.id}`
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-mid/70 hover:bg-night-soft hover:text-paper focus:outline-none focus:ring-1 focus:ring-tinted/30"
                      >
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </button>

                      {menuOpenId === `mob-${item.id}` && (
                        <>
                          <button
                            type="button"
                            className="fixed inset-0 z-30 cursor-default"
                            aria-label="Close menu"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1.5 z-40 w-36 rounded-xl border border-tinted/20 bg-night-soft p-1 shadow-xl animate-in fade-in zoom-in-95 text-left">
                            {isBook ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  if (item.rawBook) handleOpenEditBook(item.rawBook);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-night"
                              >
                                <PencilIcon className="h-3.5 w-3.5 text-gray-mid" />
                                <span>Edit</span>
                              </button>
                            ) : isNow ? (
                              <Link
                                href={`/admin/compose?slug=${item.slug}&type=now`}
                                onClick={() => setMenuOpenId(null)}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-night"
                              >
                                <PencilIcon className="h-3.5 w-3.5 text-gray-mid" />
                                <span>Edit</span>
                              </Link>
                            ) : (
                              <Link
                                href={`/admin/compose?slug=${item.slug}&type=${item.kind}`}
                                onClick={() => setMenuOpenId(null)}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-night"
                              >
                                <PencilIcon className="h-3.5 w-3.5 text-gray-mid" />
                                <span>Edit</span>
                              </Link>
                            )}

                            {!isNow && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  setMenuOpenId(null);
                                  openConfirmAction({
                                    kind: item.kind,
                                    action: isPublished ? "unpublish" : "publish",
                                    slug: item.slug,
                                    title: item.title,
                                  });
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                  isPublished
                                    ? "text-amber-400 hover:bg-amber-950/40"
                                    : "text-emerald-400 hover:bg-emerald-950/40"
                                }`}
                              >
                                {isPublished ? (
                                  <>
                                    <EyeSlashIcon className="h-3.5 w-3.5" />
                                    <span>Unpublish</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeIcon className="h-3.5 w-3.5" />
                                    <span>Publish</span>
                                  </>
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpenId(null);
                                openConfirmAction({
                                  kind: item.kind,
                                  action: "delete",
                                  slug: item.slug,
                                  title: item.title,
                                });
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/40"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title & Author */}
                <div>
                  <h4 className="font-serif text-base font-medium text-paper leading-snug">
                    <Link
                      href={linkHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${item.title}`}
                      aria-label={`Open ${item.title}`}
                      className="transition-colors hover:text-accent"
                    >
                      {item.title}
                    </Link>
                  </h4>
                  {isBook && item.rawBook && (
                    <p className="mt-0.5 text-xs text-gray-mid">
                      by <span className="text-paper/90 font-medium">{item.rawBook.author}</span>
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-mid">
                    {formatDisplayDate(item.date)}
                  </p>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="py-8 text-center">
              <p className="font-serif text-base text-paper">No entries found</p>
              <p className="mt-1 text-xs text-gray-mid">No entries match your search and filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop View (hidden md:block) ── */}
      <div className="hidden md:block space-y-6">
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-normal text-paper md:text-3xl">
              Content
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/compose?type=now"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover"
            >
              <span>+ New Now</span>
            </Link>

            <Link
              href="/admin/compose?type=note"
              className="inline-flex items-center gap-1.5 rounded-full border border-tinted/20 bg-post-card px-4 py-2 text-xs font-semibold text-paper shadow-2xs transition-colors hover:bg-night-soft"
            >
              <span>+ New Note</span>
            </Link>

            <Link
              href="/admin/compose?type=post"
              className="inline-flex items-center gap-1.5 rounded-full border border-tinted/20 bg-post-card px-4 py-2 text-xs font-semibold text-paper shadow-2xs transition-colors hover:bg-night-soft"
            >
              <span>+ New Post</span>
            </Link>

            <button
              type="button"
              onClick={handleOpenCreateBook}
              className="inline-flex items-center gap-1.5 rounded-full border border-tinted/20 bg-post-card px-4 py-2 text-xs font-semibold text-paper shadow-2xs transition-colors hover:bg-night-soft"
            >
              <span>+ Add Book</span>
            </button>
          </div>
        </div>

        {/* Search & Multi-Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title, slug, or persona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-tinted/20 bg-night-soft px-4 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ContentFilterType)}
              className="rounded-full border border-tinted/20 bg-night-soft px-3 py-2 text-xs font-medium text-paper focus:border-tinted/40 focus:outline-none truncate"
            >
              <option value="all" className="bg-night text-paper">
                All Types
              </option>
              <option value="post" className="bg-night text-paper">
                Essays ({posts.length})
              </option>
              <option value="note" className="bg-night text-paper">
                Notes ({notes.length})
              </option>
              <option value="book" className="bg-night text-paper">
                Books ({books.length})
              </option>
              <option value="now" className="bg-night text-paper">
                Now ({nowEntries.length})
              </option>
            </select>

            {/* Persona Filter */}
            <select
              value={personaFilter}
              onChange={(e) =>
                setPersonaFilter(e.target.value as PersonaFilterType)
              }
              className="rounded-full border border-tinted/20 bg-night-soft px-3 py-2 text-xs font-medium text-paper focus:border-tinted/40 focus:outline-none truncate"
            >
              <option value="all" className="bg-night text-paper">
                All Personas
              </option>
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
              className="rounded-full border border-tinted/20 bg-night-soft px-3 py-2 text-xs font-medium text-paper focus:border-tinted/40 focus:outline-none truncate"
            >
              <option value="all" className="bg-night text-paper">
                All Status
              </option>
              <option value="published" className="bg-night text-paper">
                Published
              </option>
              <option value="unpublished" className="bg-night text-paper">
                Draft
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Unified Content Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-tinted/20 bg-post-card shadow-sm">
        <div className="overflow-x-auto min-h-[260px]">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Content management table</caption>
            <thead className="border-b border-tinted/20 bg-night-soft text-xs font-semibold uppercase tracking-wider text-gray-mid">
              <tr>
                <th scope="col" className="px-5 py-3.5">Title</th>
                <th scope="col" className="px-4 py-3.5">Type</th>
                <th scope="col" className="px-4 py-3.5">Persona</th>
                <th scope="col" className="px-4 py-3.5">Date</th>
                <th scope="col" className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tinted/20">
              {filteredItems.map((item, rowIndex) => {
                const isBook = item.kind === "book";
                const isNow = item.kind === "now";
                const isPublished =
                  !isBook && !isNow && item.status !== "unpublished";
                const linkHref =
                  item.kind === "post"
                    ? `/p/${item.slug}`
                    : item.kind === "note"
                      ? `/n/${item.slug}`
                      : item.kind === "now"
                        ? "/now"
                        : "/library";

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-night-soft/60"
                  >
                    {/* Title */}
                    <td className="px-5 py-4">
                      <div className="font-serif text-base font-medium text-paper">
                        <Link
                          href={linkHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Open ${item.title}`}
                          aria-label={`Open ${item.title}`}
                          className="font-serif text-base font-medium text-paper transition-colors hover:text-accent"
                        >
                          {item.title}
                        </Link>
                      </div>
                      {isBook && item.rawBook && (
                        <p className="mt-0.5 text-xs text-gray-mid">
                          by{" "}
                          <span className="font-medium text-paper/90">
                            {item.rawBook.author}
                          </span>
                        </p>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                          item.kind === "post"
                            ? "bg-accent text-paper"
                            : "bg-night-soft text-paper border border-tinted/20"
                        }`}
                      >
                        {item.kind === "post"
                          ? "Essay"
                          : item.kind === "note"
                            ? "Note"
                            : item.kind === "now"
                              ? "Now"
                              : "Book"}
                      </span>
                    </td>

                    {/* Persona */}
                    <td className="px-4 py-4 text-xs whitespace-nowrap">
                      {isNow ? (
                        <span className="text-gray-mid/50">-</span>
                      ) : (
                        <span className="capitalize text-teal font-medium">
                          {item.persona}
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-xs text-gray-mid whitespace-nowrap">
                      {formatDisplayDate(item.date)}
                    </td>

                    {/* Status & Actions */}
                    <td className="px-5 py-4 text-xs whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-2.5">
                        {isBook ? (
                          <span className="inline-flex items-center rounded-full bg-night-soft px-2.5 py-0.5 text-xs font-semibold text-gray-mid border border-tinted/20">
                            On Shelf
                          </span>
                        ) : isNow ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              rowIndex === 0
                                ? "bg-sea-blue/20 text-sea-blue border border-sea-blue/30"
                                : "bg-night-soft text-gray-mid border border-tinted/20"
                            }`}
                          >
                            {rowIndex === 0 ? "Current" : "Past"}
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isPublished
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                                : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                            }`}
                          >
                            {isPublished ? "Published" : "Draft"}
                          </span>
                        )}

                        {/* Actions Menu */}
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            aria-label={`Actions for ${item.title}`}
                            aria-haspopup="true"
                            aria-expanded={menuOpenId === item.id}
                            onClick={() =>
                              setMenuOpenId(menuOpenId === item.id ? null : item.id)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-mid transition-colors hover:bg-night-soft hover:text-paper focus:outline-none focus:ring-1 focus:ring-tinted/30"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </button>

                          {menuOpenId === item.id && (
                            <>
                              <button
                                type="button"
                                className="fixed inset-0 z-30 cursor-default"
                                aria-label="Close menu"
                                onClick={() => setMenuOpenId(null)}
                              />
                              <div
                                className={`absolute right-0 z-40 w-36 rounded-xl border border-tinted/20 bg-night-soft p-1 shadow-xl animate-in fade-in zoom-in-95 text-left ${
                                  rowIndex >= filteredItems.length - 2 && filteredItems.length >= 3
                                    ? "bottom-full mb-1.5"
                                    : "top-full mt-1.5"
                                }`}
                              >
                                {/* Edit */}
                                {isBook ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      if (item.rawBook) handleOpenEditBook(item.rawBook);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-night"
                                  >
                                    <PencilIcon className="h-3.5 w-3.5 text-gray-mid" />
                                    <span>Edit</span>
                                  </button>
                                ) : isNow ? (
                                  <Link
                                    href={`/admin/compose?slug=${item.slug}&type=now`}
                                    onClick={() => setMenuOpenId(null)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-night"
                                  >
                                    <PencilIcon className="h-3.5 w-3.5 text-gray-mid" />
                                    <span>Edit</span>
                                  </Link>
                                ) : (
                                  <Link
                                    href={`/admin/compose?slug=${item.slug}&type=${item.kind}`}
                                    onClick={() => setMenuOpenId(null)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-night"
                                  >
                                    <PencilIcon className="h-3.5 w-3.5 text-gray-mid" />
                                    <span>Edit</span>
                                  </Link>
                                )}

                                {/* Publish / Unpublish (posts, notes & books) */}
                                {!isNow && (
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      openConfirmAction({
                                        kind: item.kind,
                                        action: isPublished ? "unpublish" : "publish",
                                        slug: item.slug,
                                        title: item.title,
                                      });
                                    }}
                                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                      isPublished
                                        ? "text-amber-400 hover:bg-amber-950/40"
                                        : "text-emerald-400 hover:bg-emerald-950/40"
                                    }`}
                                  >
                                    {isPublished ? (
                                      <>
                                        <EyeSlashIcon className="h-3.5 w-3.5" />
                                        <span>Unpublish</span>
                                      </>
                                    ) : (
                                      <>
                                        <EyeIcon className="h-3.5 w-3.5" />
                                        <span>Publish</span>
                                      </>
                                    )}
                                  </button>
                                )}

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    openConfirmAction({
                                      kind: item.kind,
                                      action: "delete",
                                      slug: item.slug,
                                      title: item.title,
                                    });
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/40"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <EmptyTableState
                  colSpan={5}
                  title="No entries found"
                  description="No entries match your search and filter criteria."
                />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Confirmation Modal (Publish / Unpublish / Delete) */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-tinted/20 bg-night-soft p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-serif text-xl font-normal text-paper">
              {confirmAction.action === "delete"
                ? `Delete ${
                    confirmAction.kind === "post"
                      ? "Essay"
                      : confirmAction.kind === "note"
                        ? "Note"
                        : confirmAction.kind === "now"
                          ? "Now Entry"
                          : "Book"
                  }?`
                : confirmAction.action === "unpublish"
                  ? "Unpublish?"
                  : "Publish?"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-mid">
              {confirmAction.action === "delete" ? (
                <>
                  Are you sure you want to delete{" "}
                  <b className="text-paper">{confirmAction.title}</b>? This
                  action cannot be undone.
                  {confirmAction.action === "delete" && (
                    <span className="mt-3 block">
                      Type the full title to confirm:
                    </span>
                  )}
                </>
              ) : (
                <>
                  Are you sure you want to{" "}
                  {confirmAction.action === "unpublish"
                    ? "unpublish"
                    : "publish"}{" "}
                  <b className="text-paper">{confirmAction.title}</b>?
                </>
              )}
            </p>
            {confirmAction.action === "delete" && (
              <input
                type="text"
                autoFocus
                placeholder="Type the full title to confirm"
                value={confirmTypedTitle}
                onChange={(e) => setConfirmTypedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    confirmTypedTitle === confirmAction.title
                  ) {
                    handleConfirmAction();
                  }
                }}
                className="mt-3 w-full rounded-xl border border-tinted/20 bg-night px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
              />
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-full px-4 py-2 text-xs font-medium text-gray-mid hover:text-paper"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isPending ||
                  (confirmAction.action === "delete" &&
                    confirmTypedTitle !== confirmAction.title)
                }
                onClick={handleConfirmAction}
                className={`rounded-full px-5 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50 ${
                  confirmAction.action === "delete" ? "bg-red-700" : "bg-accent"
                }`}
              >
                {isPending
                  ? "Processing..."
                  : confirmAction.action === "delete"
                    ? "Confirm Delete"
                    : confirmAction.action === "unpublish"
                      ? "Unpublish"
                      : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Editor Modal: self-contained, does not cause ContentManager re-renders */}
      {isEditingPost && (
        <PostEditorModal
          editingPost={editingPost}
          allPosts={posts}
          allNotes={notes}
          allBooks={books}
          mediaItems={mediaItems}
          onSaved={handlePostSaved}
          onClose={() => setIsEditingPost(false)}
          showToast={showToast}
        />
      )}

      {/* Note Editor Modal: self-contained, does not cause ContentManager re-renders */}
      {isEditingNote && (
        <NoteEditorModal
          editingNote={editingNote}
          allNotes={notes}
          allPosts={posts}
          allBooks={books}
          onSaved={handleNoteSaved}
          onClose={() => setIsEditingNote(false)}
          showToast={showToast}
        />
      )}

      {/* Book Editor Modal */}
      {isEditingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs sm:p-6">
          <div className="relative my-8 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-tinted/20 bg-night p-6 shadow-2xl sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-2xl font-normal text-paper">
                  {editingBook ? "Edit Book" : "Add Book to Library"}
                </h3>
                {editingBook && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      editingBook.isPublished !== false && editingBook.status !== "unpublished"
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                        : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                    }`}
                  >
                    {editingBook.isPublished !== false && editingBook.status !== "unpublished"
                      ? "Published"
                      : "Draft"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsEditingBook(false)}
                className="rounded-full p-2 text-gray-mid transition-colors hover:bg-night-soft hover:text-paper"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="mt-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
                {/* Cover preview + sources panel */}
                <div className="mx-auto w-full max-w-[200px] lg:mx-0">
                  <BookCoverPicker
                    value={bookCover}
                    onChange={setBookCover}
                    mediaItems={availableMedia}
                    onMediaAdded={handleBookCoverUploaded}
                    title={bookTitle}
                    author={bookAuthor}
                  />
                </div>

                {/* Form fields */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <input
                      type="text"
                      required
                      placeholder="Book Title"
                      value={bookTitle}
                      onChange={(e) => {
                        setBookTitle(e.target.value);
                        if (!editingBook) {
                          const base = slugify(e.target.value) || 'untitled-book';
                          const existingSlugs = books.map((b) => b.slug);
                          let candidate = base;
                          let counter = 2;
                          while (existingSlugs.includes(candidate)) {
                            candidate = `${base}-${counter}`;
                            counter++;
                          }
                          setBookSlug(candidate);
                        }
                      }}
                      className="w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        placeholder="Author Name"
                        value={bookAuthor}
                        onChange={(e) => setBookAuthor(e.target.value)}
                        className="w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="book-slug"
                        value={bookSlug}
                        onChange={(e) => setBookSlug(slugify(e.target.value))}
                        className="w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 font-mono text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <select
                      value={bookPersona}
                      onChange={(e) =>
                        setBookPersona(e.target.value as Persona)
                      }
                      className="w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper focus:border-tinted/40 focus:outline-none"
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
                    <input
                      type="text"
                      placeholder="Tags"
                      value={bookTagsInput}
                      onChange={(e) => setBookTagsInput(e.target.value)}
                      className="w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                    />
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Note / Summary"
                    value={bookDescription}
                    onChange={(e) => setBookDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                  />

                  <input
                    type="url"
                    placeholder="External Link"
                    value={bookLink}
                    onChange={(e) => setBookLink(e.target.value)}
                    className="w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-tinted/20 pt-5">
                <div>
                  {/* Unpublish button for already published books */}
                  {editingBook && editingBook.isPublished !== false && editingBook.status !== "unpublished" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSaveBookWithStatus(false)}
                      className="rounded-full border border-amber-800/40 bg-amber-950/30 px-5 py-2 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-900/50 disabled:opacity-50"
                    >
                      {isPending ? "Updating..." : "Unpublish"}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingBook(false)}
                    className="rounded-full px-5 py-2 text-xs font-semibold text-gray-mid transition-colors hover:text-paper"
                  >
                    Cancel
                  </button>

                  {/* Save as Draft button when adding a new book or editing a draft book */}
                  {(!editingBook || editingBook.isPublished === false || editingBook.status === "unpublished") && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSaveBookWithStatus(false)}
                      className="rounded-full border border-tinted/20 bg-night-soft px-5 py-2 text-xs font-semibold text-paper transition-colors hover:bg-night hover:border-tinted/40 disabled:opacity-50"
                    >
                      {isPending ? "Saving..." : "Save as Draft"}
                    </button>
                  )}

                  {/* Publish button */}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSaveBookWithStatus(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-xs font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
                  >
                    {isPending
                      ? "Publishing..."
                      : editingBook && editingBook.isPublished !== false && editingBook.status !== "unpublished"
                        ? "Publish Changes"
                        : "Publish"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
