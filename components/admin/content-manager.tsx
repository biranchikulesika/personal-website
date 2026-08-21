"use client";

import {
  deleteBookAction,
  deleteNoteAction,
  deleteNowEntryAction,
  deletePostAction,
  saveBookAction,
  saveNoteAction,
  savePostAction,
  toggleNoteStatusAction,
  togglePostStatusAction,
} from "@/app/admin/actions";
import {
  ExternalLinkIcon,
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
  markdownToPostSections,
  sectionsToMarkdown,
  slugify,
} from "@/lib/utils";
import Link from "next/link";
import { EmptyTableState } from "@/components/ui/states";
import { useState, useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastView } from "@/components/ui/toast-view";
import { BookCoverPicker } from "./book-cover-picker";
import { MDXEditor } from "./mdx-editor/mdx-editor";

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

  // Post Editor State
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postPersona, setPostPersona] = useState<Persona>("builder");
  const [postStatus, setPostStatus] = useState<"published" | "unpublished">(
    "published",
  );
  const [postTagsInput, setPostTagsInput] = useState("");
  const [postPlantedAt, setPostPlantedAt] = useState("");
  const [postLastTendedAt, setPostLastTendedAt] = useState("");
  const [postAssumedAudience, setPostAssumedAudience] = useState("");
  const [postMdxContent, setPostMdxContent] = useState("");

  // Note Editor State
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSlug, setNoteSlug] = useState("");
  const [noteSubtitle, setNoteSubtitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [noteDate, setNoteDate] = useState("");
  const [notePersona, setNotePersona] = useState<Persona>("thinker");
  const [noteStatus, setNoteStatus] = useState<"published" | "unpublished">(
    "published",
  );
  const [noteTagsInput, setNoteTagsInput] = useState("");
  const [noteMdxContent, setNoteMdxContent] = useState("");

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



  // Post Handlers
  function handleOpenCreatePost() {
    setEditingPost(null);
    setPostTitle("");
    setPostSlug("");
    setPostDescription("");
    setPostPersona("builder");
    setPostStatus("published");
    setPostTagsInput("craft, software, tools");
    setPostPlantedAt(new Date().toISOString().split("T")[0]);
    setPostLastTendedAt(new Date().toISOString().split("T")[0]);
    setPostAssumedAudience("Curious technologists and builders");
    setPostMdxContent(
      "An opening reflection on tools, craft, and technology.\n\n## First Principle\n\nWe often build digital things quickly before understanding their long-term impact on our attention.\n\n> [!NOTE]\n> Taking the slower path usually yields more resilient systems.\n\n## The Architecture of Quiet Spaces\n\nSoftware should feel like an orderly workshop, not a crowded marketplace.",
    );
    setIsEditingPost(true);
  }

  function handleOpenEditPost(post: BlogPost) {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostSlug(post.slug);
    setPostDescription(post.description);
    setPostPersona("builder");
    setPostStatus(post.status || "published");
    setPostTagsInput(post.tags.join(", "));
    setPostPlantedAt(post.publishedAt);
    setPostLastTendedAt(post.lastEditedAt);
    setPostAssumedAudience(post.assumedAudience || "");
    setPostMdxContent(sectionsToMarkdown(post.intro, post.sections));
    setIsEditingPost(true);
  }

  function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postTitle.trim() || !postSlug.trim()) return;

    const parsedTags = postTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanSlug = slugify(postSlug || postTitle || "untitled-essay");
    const isTakenByPost = posts.some(
      (p) => p.slug === cleanSlug && p.slug !== editingPost?.slug,
    );
    const isTakenByNote = notes.some((n) => n.slug === cleanSlug);
    const isTakenByBook = books.some((b) => b.slug === cleanSlug);
    if (isTakenByPost || isTakenByNote || isTakenByBook) {
      showToast(
        `Slug "${cleanSlug}" is already in use. Please choose a unique slug.`,
      );
      return;
    }

    const { intro, sections } = markdownToPostSections(postMdxContent);

    const postPayload: BlogPost = {
      title: postTitle,
      slug: cleanSlug,
      description:
        postDescription || (intro[0] ? intro[0].slice(0, 150) : postTitle),
      tags: parsedTags.length > 0 ? parsedTags : ["essay"],
      publishedAt: postPlantedAt || new Date().toISOString().split("T")[0],
      lastEditedAt: postLastTendedAt || new Date().toISOString().split("T")[0],
      assumedAudience: postAssumedAudience,
      intro: intro.length > 0 ? intro : [postDescription],
      sections:
        sections.length > 0
          ? sections
          : [
              {
                id: "section-1",
                heading: "Overview",
                paragraphs: [postMdxContent || ""],
              },
            ],
      books: editingPost?.books || [],
      status: postStatus,
    };

    startTransition(async () => {
      if (editingPost && editingPost.slug !== cleanSlug) {
        await deletePostAction(editingPost.slug);
      }
      const res = await savePostAction(postPayload, postPersona);
      if (res.success && res.post) {
        setPosts((prev) => {
          const filtered = prev.filter(
            (p) => p.slug !== editingPost?.slug && p.slug !== cleanSlug,
          );
          return [postPayload, ...filtered];
        });
        setIsEditingPost(false);
        showToast(`Essay "${postTitle}" saved successfully with MDX!`);
      } else {
        showToast(res.error || "Failed to save post");
      }
    });
  }

  function handleOpenCreateNote() {
    setEditingNote(null);
    setNoteTitle("");
    setNoteSlug("");
    setNoteSubtitle("");
    setNoteDescription("");
    setNoteDate(new Date().toISOString().split("T")[0]);
    setNotePersona("thinker");
    setNoteStatus("published");
    setNoteTagsInput("notes, thoughts");
    setNoteMdxContent(
      "An atomic thought or brief observation.\n\n> [!TIP]\n> Keep notes focused on a single coherent idea.",
    );
    setIsEditingNote(true);
  }

  function handleOpenEditNote(note: NoteItem) {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteSlug(note.slug);
    setNoteSubtitle(note.subtitle || "");
    setNoteDescription(note.description);
    setNoteDate(note.date);
    setNotePersona(note.persona);
    setNoteStatus(note.status || "published");
    setNoteTagsInput(note.tags.join(", "));
    setNoteMdxContent(note.content.join("\n\n"));
    setIsEditingNote(true);
  }

  function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    const cleanSlug = slugify(noteSlug || noteTitle || "untitled-note");
    const isTakenByNote = notes.some(
      (n) => n.slug === cleanSlug && n.slug !== editingNote?.slug,
    );
    const isTakenByPost = posts.some((p) => p.slug === cleanSlug);
    const isTakenByBook = books.some((b) => b.slug === cleanSlug);
    if (isTakenByNote || isTakenByPost || isTakenByBook) {
      showToast(
        `Slug "${cleanSlug}" is already in use. Please choose a unique slug.`,
      );
      return;
    }

    const parsedTags = noteTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const parsedParagraphs = noteMdxContent
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const notePayload: NoteItem = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      title: noteTitle,
      slug: cleanSlug,
      subtitle: noteSubtitle.trim() || undefined,
      description:
        noteDescription ||
        noteSubtitle ||
        (parsedParagraphs[0] ? parsedParagraphs[0].slice(0, 120) : noteTitle),
      content:
        parsedParagraphs.length > 0 ? parsedParagraphs : [noteDescription],
      date: noteDate || new Date().toISOString().split("T")[0],
      persona: notePersona,
      tags: parsedTags.length > 0 ? parsedTags : ["note"],
      status: noteStatus,
    };

    startTransition(async () => {
      if (editingNote && editingNote.slug !== cleanSlug) {
        await deleteNoteAction(editingNote.slug);
      }
      const res = await saveNoteAction(notePayload);
      if (res.success && res.note) {
        setNotes((prev) => {
          const filtered = prev.filter(
            (n) => n.slug !== editingNote?.slug && n.slug !== cleanSlug,
          );
          return [notePayload, ...filtered];
        });
        setIsEditingNote(false);
        showToast(`Note "${noteTitle}" saved successfully!`);
      } else {
        showToast(res.error || "Failed to save note");
      }
    });
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
    setBookTagsInput("philosophy, craft");
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

  function handleSaveBook(e: React.FormEvent) {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

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
          return [bookPayload, ...filtered];
        });
        setIsEditingBook(false);
        showToast(`Book "${bookTitle}" saved to library shelf!`);
      } else {
        showToast(res.error || "Failed to save book");
      }
    });
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
      status: undefined,
      rawPost: undefined,
      rawNote: undefined,
      rawBook: b,
      rawNow: undefined,
    })),
    ...nowEntries.map((n) => ({
      kind: "now" as const,
      id: n.id,
      slug: n.id,
      title: n.title,
      date: n.date,
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

    if (item.kind === "book" || item.kind === "now")
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

                  <div>
                    {isBook ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-night-soft px-2 py-0.5 text-[10px] font-semibold text-gray-mid border border-tinted/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                        On Shelf
                      </span>
                    ) : isNow ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          rowIndex === 0
                            ? "bg-sea-blue/20 text-sea-blue border border-sea-blue/30"
                            : "bg-night-soft text-gray-mid border border-tinted/20"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            rowIndex === 0 ? "bg-sea-blue" : "bg-gray-mid"
                          }`}
                        />
                        {rowIndex === 0 ? "Current" : "Past"}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isPublished
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isPublished ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        {isPublished ? "Published" : "Draft"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Author */}
                <div>
                  <h4 className="font-serif text-base font-medium text-paper leading-snug">
                    {item.title}
                  </h4>
                  {isBook && item.rawBook && (
                    <p className="mt-0.5 text-xs text-gray-mid">
                      by <span className="text-paper/90 font-medium">{item.rawBook.author}</span>
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-mid">
                    {item.kind === "note" ? formatDisplayDate(item.date) : item.date}
                  </p>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center justify-between border-t border-tinted/20 pt-2.5 gap-2">
                  <Link
                    href={linkHref}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-lg bg-night-soft border border-tinted/20 px-2.5 py-1.5 text-xs font-medium text-gray-mid hover:text-paper"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    <span>View</span>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {!isBook && !isNow && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          openConfirmAction({
                            kind: item.kind,
                            action: isPublished ? "unpublish" : "publish",
                            slug: item.slug,
                            title: item.title,
                          })
                        }
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                          isPublished
                            ? "bg-amber-950/40 text-amber-400 border border-amber-800/30"
                            : "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30"
                        }`}
                      >
                        {isPublished ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                        <span>{isPublished ? "Draft" : "Publish"}</span>
                      </button>
                    )}

                    {isBook && item.rawBook && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditBook(item.rawBook!)}
                        className="inline-flex items-center gap-1 rounded-lg bg-night-soft border border-tinted/20 px-2.5 py-1.5 text-xs font-medium text-paper"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    )}

                    {isNow && (
                      <Link
                        href="/admin/compose?type=now"
                        className="inline-flex items-center gap-1 rounded-lg bg-night-soft border border-tinted/20 px-2.5 py-1.5 text-xs font-medium text-paper"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>
                    )}

                    {!isBook && !isNow && (
                      <button
                        type="button"
                        onClick={() => {
                          if (item.kind === "post" && item.rawPost) {
                            handleOpenEditPost(item.rawPost);
                          } else if (item.kind === "note" && item.rawNote) {
                            handleOpenEditNote(item.rawNote);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-night-soft border border-tinted/20 px-2.5 py-1.5 text-xs font-medium text-paper"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        openConfirmAction({
                          kind: item.kind,
                          action: "delete",
                          slug: item.slug,
                          title: item.title,
                        })
                      }
                      className="rounded-lg p-1.5 text-gray-mid hover:bg-red-950/40 hover:text-red-400"
                      aria-label={`Delete ${item.title}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Content management table</caption>
            <thead className="border-b border-tinted/20 bg-night-soft text-xs font-semibold uppercase tracking-wider text-gray-mid">
              <tr>
                <th scope="col" className="px-5 py-3.5">Title</th>
                <th scope="col" className="px-4 py-3.5">Type</th>
                <th scope="col" className="px-4 py-3.5">Persona</th>
                <th scope="col" className="px-4 py-3.5">Date</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
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
                        {item.title}
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
                        <span className="text-gray-mid/50">—</span>
                      ) : (
                        <span className="capitalize text-teal font-medium">
                          {item.persona}
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-xs text-gray-mid whitespace-nowrap">
                      {item.kind === "note"
                        ? formatDisplayDate(item.date)
                        : item.date}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-xs whitespace-nowrap">
                      {isBook ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-night-soft px-2.5 py-0.5 text-xs font-semibold text-gray-mid border border-tinted/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                          On Shelf
                        </span>
                      ) : isNow ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            rowIndex === 0
                              ? "bg-sea-blue/20 text-sea-blue border border-sea-blue/30"
                              : "bg-night-soft text-gray-mid border border-tinted/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              rowIndex === 0 ? "bg-sea-blue" : "bg-gray-mid"
                            }`}
                          />
                          {rowIndex === 0 ? "Current" : "Past"}
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isPublished
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                              : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isPublished ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                          />
                          {isPublished ? "Published" : "Draft"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {isBook ? (
                          <>
                            <Link
                              href={linkHref}
                              target="_blank"
                              title="View on Shelf"
                              aria-label={`View ${item.title} on shelf`}
                              className="rounded-full p-2 text-gray-mid transition-colors hover:bg-night-soft hover:text-paper"
                            >
                              <ExternalLinkIcon className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              title="Edit"
                              aria-label={`Edit ${item.title}`}
                              onClick={() =>
                                item.rawBook && handleOpenEditBook(item.rawBook)
                              }
                              className="rounded-full p-2 text-paper transition-colors hover:bg-night-soft"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Remove"
                              aria-label={`Remove ${item.title}`}
                              onClick={() =>
                                openConfirmAction({
                                  kind: "book",
                                  action: "delete",
                                  slug: item.slug,
                                  title: item.title,
                                })
                              }
                              className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-950/40"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        ) : isNow ? (
                          <>
                            <Link
                              href="/now"
                              target="_blank"
                              title="View Now page"
                              aria-label={`View ${item.title} on the Now page`}
                              className="rounded-full p-2 text-gray-mid transition-colors hover:bg-night-soft hover:text-paper"
                            >
                              <ExternalLinkIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/compose?slug=${item.slug}&type=now`}
                              title="Edit"
                              aria-label={`Edit ${item.title}`}
                              className="rounded-full p-2 text-paper transition-colors hover:bg-night-soft"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              title="Delete"
                              aria-label={`Delete ${item.title}`}
                              onClick={() =>
                                openConfirmAction({
                                  kind: "now",
                                  action: "delete",
                                  slug: item.slug,
                                  title: item.title,
                                })
                              }
                              className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-950/40"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        ) : isPublished ? (
                          <>
                            <Link
                              href={linkHref}
                              target="_blank"
                              title="View"
                              aria-label={`View ${item.title}`}
                              className="rounded-full p-2 text-gray-mid transition-colors hover:bg-night-soft hover:text-paper"
                            >
                              <ExternalLinkIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/compose?slug=${item.slug}&type=${item.kind}`}
                              title="Edit"
                              aria-label={`Edit ${item.title}`}
                              className="rounded-full p-2 text-paper transition-colors hover:bg-night-soft"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              title="Unpublish"
                              aria-label={`Unpublish ${item.title}`}
                              disabled={isPending}
                              onClick={() =>
                                openConfirmAction({
                                  kind: item.kind,
                                  action: "unpublish",
                                  slug: item.slug,
                                  title: item.title,
                                })
                              }
                              className="rounded-full p-2 text-amber-400 transition-colors hover:bg-amber-950/40"
                            >
                              <EyeSlashIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              aria-label={`Delete ${item.title}`}
                              onClick={() =>
                                openConfirmAction({
                                  kind: item.kind,
                                  action: "delete",
                                  slug: item.slug,
                                  title: item.title,
                                })
                              }
                              className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-950/40"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={linkHref}
                              target="_blank"
                              title="Preview"
                              aria-label={`Preview ${item.title}`}
                              className="rounded-full p-2 text-gray-mid transition-colors hover:bg-night-soft hover:text-paper"
                            >
                              <ExternalLinkIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/compose?slug=${item.slug}&type=${item.kind}`}
                              title="Edit"
                              aria-label={`Edit ${item.title}`}
                              className="rounded-full p-2 text-paper transition-colors hover:bg-night-soft"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              title="Publish"
                              aria-label={`Publish ${item.title}`}
                              disabled={isPending}
                              onClick={() =>
                                openConfirmAction({
                                  kind: item.kind,
                                  action: "publish",
                                  slug: item.slug,
                                  title: item.title,
                                })
                              }
                              className="rounded-full p-2 text-emerald-400 transition-colors hover:bg-emerald-950/40"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              aria-label={`Delete ${item.title}`}
                              onClick={() =>
                                openConfirmAction({
                                  kind: item.kind,
                                  action: "delete",
                                  slug: item.slug,
                                  title: item.title,
                                })
                              }
                              className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-950/40"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <EmptyTableState
                  colSpan={6}
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

      {/* Full Essay Composer Modal with MDX Editor */}
      {isEditingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6 backdrop-blur-xs">
          <div className="relative my-4 max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-tinted/20 bg-night p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-tinted/20 pb-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-paper">
                  {editingPost ? "Edit Post" : "New Post"}
                </h3>
                <p className="mt-0.5 text-xs text-gray-mid">
                  Author long-form essays with live split-view markdown and rich
                  component insertions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPost(false)}
                className="rounded-full p-2 text-gray-mid hover:bg-night-soft hover:text-paper"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePost} className="mt-6 space-y-6">
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
                    value={postTitle}
                    onChange={(e) => {
                      setPostTitle(e.target.value);
                      if (!editingPost && !postSlug) {
                        setPostSlug(slugify(e.target.value));
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
                    value={postSlug}
                    onChange={(e) => setPostSlug(slugify(e.target.value))}
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
                    value={postStatus}
                    onChange={(e) =>
                      setPostStatus(
                        e.target.value as "published" | "unpublished",
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
                  <label htmlFor="post-persona" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    Persona Theme
                  </label>
                  <select
                    id="post-persona"
                    value={postPersona}
                    onChange={(e) => setPostPersona(e.target.value as Persona)}
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
                  <label htmlFor="post-planted-date" className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    Planted Date
                  </label>
                  <input
                    id="post-planted-date"
                    type="date"
                    value={postPlantedAt}
                    onChange={(e) => setPostPlantedAt(e.target.value)}
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
                    value={postTagsInput}
                    onChange={(e) => setPostTagsInput(e.target.value)}
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
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
              </div>

              {/* Rich MDX Editor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid mb-1.5">
                  Essay Body (Markdown & MDX)
                </label>
                <MDXEditor
                  initialContent={postMdxContent}
                  title={postTitle}
                  subtitle={postDescription}
                  persona={postPersona}
                  date={postPlantedAt}
                  mediaItems={mediaItems}
                  embedBooks={books}
                  embedPosts={posts}
                  embedNotes={notes}
                  onChange={(val) => setPostMdxContent(val)}
                  className="h-[520px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-tinted/20">
                <button
                  type="button"
                  onClick={() => setIsEditingPost(false)}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-gray-mid hover:text-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-accent px-6 py-2.5 text-xs font-semibold text-paper shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving Essay..." : "Save Essay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Composer Modal with MDX Editor */}
      {isEditingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6 backdrop-blur-xs">
          <div className="relative my-4 max-h-[96vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-tinted/20 bg-night p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-tinted/20 pb-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-paper">
                  {editingNote ? "Edit Note" : "New Note"}
                </h3>
                <p className="mt-0.5 text-xs text-gray-mid">
                  Capture an atomic thought or observation with live MDX
                  preview.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingNote(false)}
                className="rounded-full p-2 text-gray-mid hover:bg-night-soft hover:text-paper"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="mt-6 space-y-6">
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
                    value={noteTitle}
                    onChange={(e) => {
                      setNoteTitle(e.target.value);
                      if (!editingNote && !noteSlug) {
                        setNoteSlug(slugify(e.target.value));
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
                    value={noteSlug}
                    onChange={(e) => setNoteSlug(slugify(e.target.value))}
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
                  value={noteSubtitle}
                  onChange={(e) => setNoteSubtitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    Status
                  </label>
                  <select
                    value={noteStatus}
                    onChange={(e) =>
                      setNoteStatus(
                        e.target.value as "published" | "unpublished",
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
                    value={notePersona}
                    onChange={(e) => setNotePersona(e.target.value as Persona)}
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
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
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
                    value={noteTagsInput}
                    onChange={(e) => setNoteTagsInput(e.target.value)}
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
                  initialContent={noteMdxContent}
                  title={noteTitle}
                  subtitle={noteDescription}
                  persona={notePersona}
                  date={noteDate}
                  mediaItems={mediaItems}
                  embedBooks={initialBooks}
                  embedPosts={initialPosts}
                  embedNotes={initialNotes}
                  onChange={(val) => setNoteMdxContent(val)}
                  className="h-[440px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-tinted/20">
                <button
                  type="button"
                  onClick={() => setIsEditingNote(false)}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-gray-mid hover:text-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-accent px-6 py-2.5 text-xs font-semibold text-paper shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving Note..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Editor Modal */}
      {isEditingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs sm:p-6">
          <div className="relative my-8 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-tinted/20 bg-night p-6 shadow-2xl sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-paper">
                  {editingBook ? "Edit Book" : "Add Book to Library"}
                </h3>
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
                        if (!editingBook && !bookSlug) {
                          setBookSlug(slugify(e.target.value));
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
              <div className="mt-8 flex items-center justify-end gap-3 border-t border-tinted/20 pt-5">
                <button
                  type="button"
                  onClick={() => setIsEditingBook(false)}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-gray-mid transition-colors hover:text-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-xs font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
