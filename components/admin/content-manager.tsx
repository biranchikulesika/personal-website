"use client";

import {
  deleteBookAction,
  deleteNoteAction,
  deleteNowEntryAction,
  deletePostAction,
  saveBookAction,
  saveNoteAction,
  saveNowEntryAction,
  savePostAction,
  toggleBookStatusAction,
  toggleNoteStatusAction,
  togglePostStatusAction,
} from "@/app/admin/actions";
import {
  ArchiveIcon,
  ChevronDownIcon,
  CloseIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  GridIcon,
  ListIcon,
  PencilIcon,
  SearchIcon,
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
import { formatDisplayDate, slugify, stripMarkdown } from "@/lib/utils";
import {
  FILTER_LABELS,
  formatLibraryToken,
  mergeLibraryFilterTokens,
  parseLibraryToken,
  tokenValueLabel,
  type LibraryFilterToken,
  type LibrarySort,
} from "@/lib/library-query";
import Link from "next/link";
import { NoContentState, NoSearchResults } from "@/components/ui/states";
import { useEffect, useState, useTransition } from "react";
import type {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastView } from "@/components/ui/toast-view";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BookCoverPicker } from "./book-cover-picker";
import { PostEditorModal } from "./mdx-editor/post-editor-modal";
import { NoteEditorModal } from "./mdx-editor/note-editor-modal";
import {
  Button,
  StatusBadge,
  TypeBadge,
  buttonClassName,
} from "./ui";

interface ContentManagerProps {
  initialPosts: BlogPost[];
  initialNotes: NoteItem[];
  initialBooks?: BookItem[];
  initialNowEntries?: NowEntry[];
  mediaItems?: MediaItem[];
  openCreateBookTrigger?: number;
}

type ViewMode = "list" | "card";

// One row in the library, whatever its source collection.
interface LibraryItem {
  kind: "post" | "note" | "book" | "now";
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  updated: string;
  persona?: Persona;
  status: "published" | "unpublished";
  cover?: string;
  author?: string;
  rawPost?: BlogPost;
  rawNote?: NoteItem;
  rawBook?: BookItem;
  rawNow?: NowEntry;
}

const kindSingular = {
  post: "essay",
  note: "note",
  now: "now entry",
  book: "book",
} as const;

const KIND_ORDER: Record<LibraryItem["kind"], number> = {
  post: 0,
  note: 1,
  now: 2,
  book: 3,
};

const STATUS_ORDER: Record<LibraryItem["status"], number> = {
  published: 0,
  unpublished: 1,
};

function compareLibraryItems(
  a: LibraryItem,
  b: LibraryItem,
  sort: LibrarySort,
): number {
  const direction = sort.direction === "asc" ? 1 : -1;
  let result = 0;

  switch (sort.field) {
    case "title":
      result = a.title.localeCompare(b.title);
      break;
    case "type":
      result = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
      break;
    case "persona":
      result = (a.persona ?? "~").localeCompare(b.persona ?? "~");
      break;
    case "status":
      result = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      break;
    case "updated":
      result = a.updated.localeCompare(b.updated);
      break;
    case "date":
      result = a.date.localeCompare(b.date);
      break;
  }

  return result !== 0 ? result * direction : a.title.localeCompare(b.title);
}

const menuItemClass =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors";

const menuButtonClass =
  "flex h-7 w-7 items-center justify-center rounded-md text-gray-mid transition-colors hover:bg-post-card hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";

function publicHref(item: LibraryItem): string {
  if (item.kind === "post") return `/p/${item.slug}`;
  if (item.kind === "note") return `/n/${item.slug}`;
  if (item.kind === "book") return "/library";
  return "/now";
}

function editorHref(item: LibraryItem): string {
  return `/admin/compose?type=${item.kind}&slug=${encodeURIComponent(item.slug)}`;
}

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

  // Query bar: committed filter pills plus the free-text still being typed.
  const [filterTokens, setFilterTokens] = useState<LibraryFilterToken[]>([]);
  const [queryText, setQueryText] = useState("");
  const [sort, setSort] = useState<LibrarySort>({
    field: "date",
    direction: "desc",
  });
  const [view, setView] = useState<ViewMode>("list");

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

  // Confirmation dialog state (unpublish / delete)
  const [confirmAction, setConfirmAction] = useState<{
    kind: "post" | "note" | "book" | "now";
    action: "unpublish" | "delete";
    slug: string;
    id: string;
    title: string;
  } | null>(null);

  function openConfirmAction(confirm: {
    kind: "post" | "note" | "book" | "now";
    action: "unpublish" | "delete";
    slug: string;
    id: string;
    title: string;
  }) {
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

  // ── Unified library rows ──────────────────────────────────────────────────
  const items: LibraryItem[] = [
    ...posts.map((p) => ({
      kind: "post" as const,
      id: `post-${p.slug}`,
      slug: p.slug,
      title: p.title,
      excerpt: stripMarkdown(p.subtitle || p.description || ""),
      date: p.publishedAt,
      updated: p.lastEditedAt || p.publishedAt,
      persona: p.persona || "builder",
      status: (p.status || "published") as "published" | "unpublished",
      cover: p.coverImage,
      rawPost: p,
    })),
    ...notes.map((n) => ({
      kind: "note" as const,
      id: n.id || `note-${n.slug}`,
      slug: n.slug,
      title: n.title,
      excerpt: stripMarkdown(n.subtitle || n.description || ""),
      date: n.date,
      updated: n.date,
      persona: n.persona,
      status: (n.status || "published") as "published" | "unpublished",
      cover: n.coverImage,
      rawNote: n,
    })),
    ...books.map((b) => ({
      kind: "book" as const,
      id: b.id || `book-${b.slug}`,
      slug: b.slug,
      title: b.title,
      excerpt: stripMarkdown(b.description || ""),
      date: b.date,
      updated: b.date,
      persona: b.persona,
      status: (b.isPublished !== false && b.status !== "unpublished"
        ? "published"
        : "unpublished") as "published" | "unpublished",
      cover: b.cover,
      author: b.author,
      rawBook: b,
    })),
    ...nowEntries.map((n) => ({
      kind: "now" as const,
      id: n.id,
      slug: n.slug || n.id,
      title: n.title,
      excerpt: stripMarkdown(n.content || ""),
      date: n.date || "",
      updated: n.lastEditedAt || n.date || "",
      status: (n.status || "published") as "published" | "unpublished",
      rawNow: n,
    })),
  ];

  // Now has no stored status: the newest published entry is "Current".
  const currentNowId = nowEntries.find((e) => e.status !== "unpublished")?.id;

  const typeFilter =
    filterTokens.find((token) => token.key === "type")?.values ?? [];
  const statusFilter =
    filterTokens.find((token) => token.key === "status")?.values ?? [];
  const personaFilter =
    filterTokens.find((token) => token.key === "persona")?.values ?? [];
  const term = queryText.trim().toLowerCase();

  const visibleItems = items
    .filter((item) => {
      if (typeFilter.length > 0 && !typeFilter.includes(item.kind)) return false;

      if (
        personaFilter.length > 0 &&
        (!item.persona || !personaFilter.includes(item.persona))
      ) {
        return false;
      }

      if (statusFilter.length > 0) {
        const matches = statusFilter.some((status) => {
          if (status === "current")
            return item.kind === "now" && item.id === currentNowId;
          if (status === "past")
            return item.kind === "now" && item.id !== currentNowId;
          return item.status === status;
        });
        if (!matches) return false;
      }

      if (term) {
        const matchTitle = item.title.toLowerCase().includes(term);
        const matchSlug = item.slug.toLowerCase().includes(term);
        const matchPersona =
          item.persona?.toLowerCase().includes(term) ?? false;
        const matchAuthor = item.author?.toLowerCase().includes(term) ?? false;
        if (!(matchTitle || matchSlug || matchPersona || matchAuthor))
          return false;
      }

      return true;
    })
    .sort((a, b) => compareLibraryItems(a, b, sort));

  function applyParsedToken(word: string): boolean {
    const parsed = parseLibraryToken(word);
    if (!parsed) return false;

    if (parsed.kind === "filter") {
      setFilterTokens((current) =>
        mergeLibraryFilterTokens(current, parsed.token),
      );
    } else {
      setSort(parsed.sort);
    }
    return true;
  }

  // A space commits a valid key=value word into a pill; anything else stays text.
  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (!value.endsWith(" ")) {
      setQueryText(value);
      return;
    }

    const words = value.trim().split(/\s+/).filter(Boolean);
    const last = words.at(-1);
    if (!last || !applyParsedToken(last)) {
      setQueryText(value);
      return;
    }

    const remaining = words.slice(0, -1).join(" ");
    setQueryText(remaining ? `${remaining} ` : "");
  }

  function handleQueryKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      const words = queryText.trim().split(/\s+/).filter(Boolean);
      const remaining = words.filter((word) => !applyParsedToken(word));
      setQueryText(remaining.join(" "));
      return;
    }

    if (event.key === "Backspace" && queryText === "" && filterTokens.length > 0) {
      event.preventDefault();
      setFilterTokens((current) => current.slice(0, -1));
    }
  }

  function removeFilterToken(key: LibraryFilterToken["key"]) {
    setFilterTokens((current) =>
      current.filter((token) => token.key !== key),
    );
  }

  function toggleSort(field: LibrarySort["field"]) {
    setSort((prev) =>
      prev.field === field
        ? {
            field,
            direction: prev.direction === "asc" ? "desc" : "asc",
          }
        : {
            field,
            direction:
              field === "date" || field === "updated" ? "desc" : "asc",
          },
    );
  }

  function resetFilters() {
    setFilterTokens([]);
    setQueryText("");
    setSort({ field: "date", direction: "desc" });
  }

  // ── Post handlers ─────────────────────────────────────────────────────────
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

  // ── Note handlers ─────────────────────────────────────────────────────────
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

  // ── Book handlers ─────────────────────────────────────────────────────────
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
      showToast("Book title and author are required.", "warning");
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
        "warning",
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
      // Books are upserted by id, so a slug rename updates the existing row;
      // no delete of the old slug is needed (and a failed save must not remove it).
      const res = await saveBookAction(bookPayload);
      if (res.success && res.book) {
        const saved = res.book;
        setBooks((prev) => {
          const filtered = prev.filter(
            (b) => b.slug !== editingBook?.slug && b.slug !== cleanSlug,
          );
          return [saved, ...filtered];
        });
        setIsEditingBook(false);
        showToast(
          publish
            ? "Book published successfully."
            : "Draft saved successfully.",
          "success",
        );
      } else {
        showToast(res.error || "Failed to save book. Please try again.", "error");
      }
    });
  }

  function handleSaveBook(e: React.FormEvent) {
    e.preventDefault();
    const isCurrentlyPublished =
      editingBook
        ? editingBook.isPublished !== false && editingBook.status !== "unpublished"
        : true;
    handleSaveBookWithStatus(isCurrentlyPublished);
  }

  // ── Shared item mutations ─────────────────────────────────────────────────
  async function setItemStatus(
    item: LibraryItem,
    next: "published" | "unpublished",
  ): Promise<boolean> {
    if (item.status === next) return true;

    if (item.kind === "post") {
      const res = await togglePostStatusAction(item.slug);
      if (!res.success || !res.post) return false;
      const saved = res.post;
      setPosts((prev) =>
        prev.map((p) => (p.slug === item.slug ? { ...p, status: saved.status } : p)),
      );
      return true;
    }

    if (item.kind === "note") {
      const res = await toggleNoteStatusAction(item.slug);
      if (!res.success || !res.note) return false;
      const saved = res.note;
      setNotes((prev) =>
        prev.map((n) => (n.slug === item.slug ? { ...n, status: saved.status } : n)),
      );
      return true;
    }

    if (item.kind === "book") {
      const res = await toggleBookStatusAction(item.slug);
      if (!res.success || !res.book) return false;
      const saved = res.book;
      setBooks((prev) =>
        prev.map((b) =>
          b.slug === item.slug
            ? { ...b, isPublished: saved.isPublished, status: saved.status }
            : b,
        ),
      );
      return true;
    }

    // Now entries are keyed by id, not slug.
    if (!item.rawNow) return false;
    const res = await saveNowEntryAction({ ...item.rawNow, status: next });
    if (!res.success) return false;
    setNowEntries((prev) =>
      prev.map((e) => (e.id === item.id ? { ...e, status: next } : e)),
    );
    return true;
  }

  async function deleteItem(item: LibraryItem): Promise<boolean> {
    if (item.kind === "post") {
      const res = await deletePostAction(item.slug);
      if (res.success) setPosts((prev) => prev.filter((p) => p.slug !== item.slug));
      return res.success;
    }
    if (item.kind === "note") {
      const res = await deleteNoteAction(item.slug);
      if (res.success) setNotes((prev) => prev.filter((n) => n.slug !== item.slug));
      return res.success;
    }
    if (item.kind === "book") {
      const res = await deleteBookAction(item.slug);
      if (res.success) setBooks((prev) => prev.filter((b) => b.slug !== item.slug));
      return res.success;
    }
    const res = await deleteNowEntryAction(item.id);
    if (res.success)
      setNowEntries((prev) => prev.filter((e) => e.id !== item.id));
    return res.success;
  }

  // Confirmation action handler (unpublish / delete)
  function handleConfirmAction() {
    if (!confirmAction) return;
    const { action } = confirmAction;
    const item = items.find((candidate) => candidate.id === confirmAction.id);
    if (!item) {
      setConfirmAction(null);
      showToast("Item not found.", "error");
      return;
    }

    startTransition(async () => {
      if (action === "delete") {
        const ok = await deleteItem(item);
        if (ok) {
          setConfirmAction(null);
          showToast(
            `${kindSingular[item.kind].replace(/^./, (c) => c.toUpperCase())} deleted successfully.`,
            "success",
          );
        } else {
          showToast(
            `Failed to delete ${kindSingular[item.kind]}. Please try again.`,
            "error",
          );
        }
        return;
      }

      const ok = await setItemStatus(item, "unpublished");
      if (ok) {
        setConfirmAction(null);
        showToast(
          `${kindSingular[item.kind].replace(/^./, (c) => c.toUpperCase())} unpublished successfully.`,
          "success",
        );
      } else {
        showToast(
          `Failed to unpublish ${kindSingular[item.kind]}. Please try again.`,
          "error",
        );
      }
    });
  }

  // Direct publish handler (ordinary constructive action with immediate feedback)
  function handleDirectPublish(item: LibraryItem) {
    startTransition(async () => {
      const ok = await setItemStatus(item, "published");
      showToast(
        ok
          ? `${kindSingular[item.kind].replace(/^./, (c) => c.toUpperCase())} published successfully.`
          : `Failed to publish ${kindSingular[item.kind]}. Please try again.`,
        ok ? "success" : "error",
      );
    });
  }

  // Unique slug across posts, notes, books and now entries.
  function copySlug(base: string) {
    const taken = new Set([
      ...posts.map((p) => p.slug),
      ...notes.map((n) => n.slug),
      ...books.map((b) => b.slug),
      ...nowEntries.map((e) => e.slug).filter((slug): slug is string => Boolean(slug)),
    ]);
    let candidate = `${base}-copy`;
    let counter = 2;
    while (taken.has(candidate)) {
      candidate = `${base}-copy-${counter}`;
      counter += 1;
    }
    return candidate;
  }

  function handleDuplicate(item: LibraryItem) {
    const slug = copySlug(item.slug);
    const title = `${item.title} (copy)`;

    startTransition(async () => {
      if (item.kind === "post" && item.rawPost) {
        const res = await savePostAction(
          {
            ...item.rawPost,
            slug,
            title,
            status: "unpublished",
            lastEditedAt: new Date().toISOString(),
          },
          item.rawPost.persona,
        );
        if (res.success && res.post) {
          const saved = res.post;
          setPosts((prev) => [saved, ...prev.filter((p) => p.slug !== slug)]);
          showToast("Essay duplicated as a draft.", "success");
        } else {
          showToast(res.error || "Failed to duplicate essay.", "error");
        }
        return;
      }

      if (item.kind === "note" && item.rawNote) {
        const res = await saveNoteAction({
          ...item.rawNote,
          id: `note-${Date.now()}`,
          slug,
          title,
          status: "unpublished",
        });
        if (res.success && res.note) {
          const saved = res.note;
          setNotes((prev) => [saved, ...prev.filter((n) => n.slug !== slug)]);
          showToast("Note duplicated as a draft.", "success");
        } else {
          showToast(res.error || "Failed to duplicate note.", "error");
        }
        return;
      }

      if (item.kind === "book" && item.rawBook) {
        const res = await saveBookAction({
          ...item.rawBook,
          id: `book-${Date.now()}`,
          slug,
          title,
          isPublished: false,
          status: "unpublished",
        });
        if (res.success && res.book) {
          const saved = res.book;
          setBooks((prev) => [saved, ...prev.filter((b) => b.slug !== slug)]);
          showToast("Book duplicated as a draft.", "success");
        } else {
          showToast(res.error || "Failed to duplicate book.", "error");
        }
        return;
      }

      if (item.kind === "now" && item.rawNow) {
        const res = await saveNowEntryAction({
          id: `now-${crypto.randomUUID()}`,
          title,
          slug,
          content: item.rawNow.content,
          location: item.rawNow.location,
          status: "unpublished",
        });
        if (res.success && res.entry) {
          const saved = res.entry;
          setNowEntries((prev) => [saved, ...prev]);
          showToast("Now entry duplicated as a draft.", "success");
        } else {
          showToast(res.error || "Failed to duplicate now entry.", "error");
        }
      }
    });
  }

  function openEditor(item: LibraryItem) {
    if (item.kind === "book" && item.rawBook) {
      handleOpenEditBook(item.rawBook);
    } else if (item.kind === "note" && item.rawNote) {
      handleOpenEditNote(item.rawNote);
    } else if (item.kind === "post" && item.rawPost) {
      handleOpenEditPost(item.rawPost);
    }
  }

  // ── Small render helpers ─────────────────────────────────────────────────
  function renderStatus(item: LibraryItem) {
    if (item.kind === "now") {
      if (item.status === "unpublished") return <StatusBadge status="unpublished" />;
      return <StatusBadge status={item.id === currentNowId ? "current" : "past"} />;
    }
    return <StatusBadge status={item.status} />;
  }

  function renderPersona(item: LibraryItem) {
    if (!item.persona) return <span className="text-gray-mid/50">—</span>;
    return <span className="capitalize text-teal">{item.persona}</span>;
  }

  function renderMenu(item: LibraryItem, openUp = false) {
    const isOpen = menuOpenId === item.id;
    const isPublished = item.status === "published";

    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          aria-label={`Actions for ${item.title}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setMenuOpenId(isOpen ? null : item.id)}
          className={menuButtonClass}
        >
          <EllipsisVerticalIcon className="h-4 w-4" />
        </button>

        {isOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 cursor-default"
              aria-label="Close menu"
              onClick={() => setMenuOpenId(null)}
            />
            <div
              role="menu"
              className={`absolute right-0 z-40 w-40 rounded-lg border border-tinted/20 bg-night-soft p-1 text-left shadow-xl ${
                openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
              }`}
            >
              {item.kind === "book" ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpenId(null);
                    openEditor(item);
                  }}
                  className={`${menuItemClass} text-paper hover:bg-post-card`}
                >
                  <PencilIcon className="h-3.5 w-3.5 text-gray-mid" />
                  Edit
                </button>
              ) : (
                <Link
                  role="menuitem"
                  href={editorHref(item)}
                  onClick={() => setMenuOpenId(null)}
                  className={`${menuItemClass} text-paper hover:bg-post-card`}
                >
                  <PencilIcon className="h-3.5 w-3.5 text-gray-mid" />
                  Edit
                </Link>
              )}

              {isPublished ? (
                <a
                  role="menuitem"
                  href={publicHref(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpenId(null)}
                  className={`${menuItemClass} text-paper hover:bg-post-card`}
                >
                  <EyeIcon className="h-3.5 w-3.5 text-gray-mid" />
                  Preview
                </a>
              ) : (
                <Link
                  role="menuitem"
                  href={editorHref(item)}
                  onClick={() => setMenuOpenId(null)}
                  className={`${menuItemClass} text-paper hover:bg-post-card`}
                >
                  <EyeIcon className="h-3.5 w-3.5 text-gray-mid" />
                  Preview
                </Link>
              )}

              <button
                type="button"
                role="menuitem"
                disabled={isPending}
                onClick={() => {
                  setMenuOpenId(null);
                  handleDuplicate(item);
                }}
                className={`${menuItemClass} text-paper hover:bg-post-card disabled:opacity-50`}
              >
                <CopyIcon className="h-3.5 w-3.5 text-gray-mid" />
                Duplicate
              </button>

              {isPublished ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={isPending}
                  onClick={() => {
                    setMenuOpenId(null);
                    openConfirmAction({
                      kind: item.kind,
                      action: "unpublish",
                      slug: item.slug,
                      id: item.id,
                      title: item.title,
                    });
                  }}
                  className={`${menuItemClass} text-amber-400 hover:bg-amber-500/10 disabled:opacity-50`}
                >
                  <ArchiveIcon className="h-3.5 w-3.5" />
                  Archive
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  disabled={isPending}
                  onClick={() => {
                    setMenuOpenId(null);
                    handleDirectPublish(item);
                  }}
                  className={`${menuItemClass} text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50`}
                >
                  <EyeIcon className="h-3.5 w-3.5" />
                  Publish
                </button>
              )}

              <button
                type="button"
                role="menuitem"
                disabled={isPending}
                onClick={() => {
                  setMenuOpenId(null);
                  openConfirmAction({
                    kind: item.kind,
                    action: "delete",
                    slug: item.slug,
                    id: item.id,
                    title: item.title,
                  });
                }}
                className={`${menuItemClass} text-rose-300 hover:bg-rose-500/10 disabled:opacity-50`}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderCover(item: LibraryItem, className: string) {
    if (!item.cover) return null;
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={item.cover}
        alt=""
        className={`${className} rounded border border-tinted/20 object-cover`}
      />
    );
  }

  function renderSortHeader(
    label: string,
    field: LibrarySort["field"],
    className?: string,
  ) {
    const active = sort.field === field;
    return (
      <th
        scope="col"
        aria-sort={
          active
            ? sort.direction === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        className={`px-3 py-2.5 ${className ?? ""}`}
      >
        <button
          type="button"
          onClick={() => toggleSort(field)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gray-mid transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {label}
          <ChevronDownIcon
            className={`h-3 w-3 transition-transform ${
              active ? "text-paper" : "opacity-30"
            } ${active && sort.direction === "asc" ? "rotate-180" : ""}`}
          />
        </button>
      </th>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <ToastView message={toastMessage} />

      <header className="flex items-center justify-between gap-4 border-b border-tinted/20 pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-paper">
          Library
        </h1>
        <div className="flex items-center gap-0.5 rounded-lg border border-tinted/20 p-0.5">
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={`rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              view === "list"
                ? "bg-post-card text-paper"
                : "text-gray-mid hover:text-paper"
            }`}
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Card view"
            aria-pressed={view === "card"}
            onClick={() => setView("card")}
            className={`rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              view === "card"
                ? "bg-post-card text-paper"
                : "text-gray-mid hover:text-paper"
            }`}
          >
            <GridIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      {items.length === 0 ? (
        <NoContentState
          title="The library is empty"
          description="Your essays, notes, books and Now entries will appear here."
          action={
            <Link
              href="/admin/compose?type=post"
              className={buttonClassName("primary")}
            >
              New essay
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-tinted/20">
          <div
            className="flex flex-wrap items-center gap-1.5 border-b border-tinted/20 bg-night-soft/60 px-2.5 py-2 transition-colors focus-within:bg-night-soft"
            title="type=essay,note · status=draft,published · persona=builder · sort=updated,desc"
          >
            <SearchIcon className="h-3.5 w-3.5 shrink-0 text-gray-mid" />
            {filterTokens.map((token) => (
              <span
                key={token.key}
                className="inline-flex items-center gap-1 rounded-full border border-tinted/30 bg-post-card py-0.5 pl-2 pr-1 text-[11px] text-paper"
              >
                <span className="text-gray-mid">
                  {FILTER_LABELS[token.key]}:
                </span>
                {token.values.map(tokenValueLabel).join(", ")}
                <button
                  type="button"
                  onClick={() => removeFilterToken(token.key)}
                  aria-label={`Remove ${FILTER_LABELS[token.key]} filter`}
                  className="rounded-full p-0.5 text-gray-mid transition-colors hover:bg-tinted/20 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <CloseIcon className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={queryText}
              onChange={handleQueryChange}
              onKeyDown={handleQueryKeyDown}
              placeholder={
                filterTokens.length > 0
                  ? "Add another filter…"
                  : "Search or filter: type=essay,note · status=draft · persona=builder · sort=updated,desc"
              }
              aria-label="Search and filter library"
              className="min-w-40 flex-1 bg-transparent py-0.5 text-xs text-paper outline-none placeholder:text-gray-mid/70"
            />
            {(filterTokens.length > 0 || queryText) && (
              <button
                type="button"
                onClick={resetFilters}
                className="shrink-0 rounded px-1 text-[11px] text-gray-mid transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Clear
              </button>
            )}
          </div>

          {visibleItems.length === 0 ? (
            <NoSearchResults
              query={queryText || filterTokens.map(formatLibraryToken).join(" ")}
              onReset={resetFilters}
              resetLabel="Clear filters"
            />
          ) : view === "list" ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <caption className="sr-only">Library contents</caption>
                  <thead>
                    <tr className="border-b border-tinted/20">
                      <th scope="col" className="w-12 px-2 py-2.5">
                        <span className="sr-only">Cover</span>
                      </th>
                      {renderSortHeader("Title", "title")}
                      {renderSortHeader("Type", "type")}
                      {renderSortHeader("Persona", "persona")}
                      {renderSortHeader("Updated", "updated")}
                      {renderSortHeader("Status", "status")}
                      <th scope="col" className="w-12 px-3 py-2.5">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tinted/15">
                  {visibleItems.map((item, index) => {
                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-post-card/40"
                      >
                        <td className="px-2 py-2.5">
                          {renderCover(item, "h-10 w-8")}
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={
                              item.status === "published"
                                ? publicHref(item)
                                : editorHref(item)
                            }
                            target={
                              item.status === "published" ? "_blank" : undefined
                            }
                            rel={
                              item.status === "published"
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="font-serif text-sm font-medium leading-snug text-paper transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            {item.title}
                          </Link>
                          {item.author && (
                            <p className="mt-0.5 text-[11px] text-gray-mid">
                              by {item.author}
                            </p>
                          )}
                          {item.excerpt && (
                            <p className="mt-0.5 max-w-[46ch] truncate text-[11px] text-gray-mid/90">
                              {item.excerpt}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <TypeBadge kind={item.kind} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                          {renderPersona(item)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-mid">
                          {item.updated ? formatDisplayDate(item.updated) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {renderStatus(item)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {renderMenu(item, index >= visibleItems.length - 2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>

              {/* Mobile stacked rows */}
              <ul className="divide-y divide-tinted/15 md:hidden">
            {visibleItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 p-3"
              >
                {renderCover(item, "mt-0.5 h-12 w-9 shrink-0")}
                <div className="min-w-0 flex-1">
                  <Link
                    href={
                      item.status === "published"
                        ? publicHref(item)
                        : editorHref(item)
                    }
                    target={item.status === "published" ? "_blank" : undefined}
                    rel={
                      item.status === "published"
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="font-serif text-sm font-medium leading-snug text-paper transition-colors hover:text-accent"
                  >
                    {item.title}
                  </Link>
                  {item.excerpt && (
                    <p className="mt-0.5 truncate text-[11px] text-gray-mid">
                      {item.excerpt}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <TypeBadge kind={item.kind} />
                    {item.persona && (
                      <span className="capitalize text-teal">{item.persona}</span>
                    )}
                    <span className="text-gray-mid">
                      {item.updated ? formatDisplayDate(item.updated) : "—"}
                    </span>
                    {renderStatus(item)}
                  </div>
                </div>
                {renderMenu(item)}
              </li>
            ))}
          </ul>
            </>
          ) : (
            <ul className="grid grid-cols-1 items-start gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => {
            return (
              <li
                key={item.id}
                className="flex flex-col rounded-xl border border-tinted/20 bg-night-soft transition-colors hover:border-tinted/40"
              >
                <div
                  className={`relative w-full overflow-hidden rounded-t-xl border-b border-tinted/20 bg-post-card ${
                    item.kind === "book" ? "aspect-4/5" : "aspect-4/3"
                  }`}
                >
                  {item.cover && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.cover}
                      alt={`${item.title} cover`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute left-2 top-2">
                    <TypeBadge kind={item.kind} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 font-serif text-base font-medium leading-snug text-paper">
                      <Link
                        href={
                          item.status === "published"
                            ? publicHref(item)
                            : editorHref(item)
                        }
                        target={
                          item.status === "published" ? "_blank" : undefined
                        }
                        rel={
                          item.status === "published"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        {item.title}
                      </Link>
                    </h3>
                    {renderMenu(item)}
                  </div>

                  {item.excerpt && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-gray-mid">
                      {item.excerpt}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] text-gray-mid">
                    <span className="truncate">
                      {item.author
                        ? `by ${item.author}`
                        : item.persona
                          ? <span className="capitalize">{item.persona}</span>
                          : "—"}
                    </span>
                    <span className="shrink-0">
                      {item.updated ? formatDisplayDate(item.updated) : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {renderStatus(item)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
          )}
        </div>
      )}

      {/* Action Confirmation Modal (Unpublish / Delete) */}
      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        isLoading={isPending}
        title={
          confirmAction?.action === "delete"
            ? `Delete ${kindSingular[confirmAction.kind]}?`
            : `Archive ${confirmAction ? kindSingular[confirmAction.kind] : "item"}?`
        }
        description={
          confirmAction?.action === "delete" ? (
            <>
              Are you sure you want to permanently delete{" "}
              <b className="text-paper">{confirmAction.title}</b>? This action
              cannot be undone.
            </>
          ) : (
            <>
              Are you sure you want to unpublish{" "}
              <b className="text-paper">{confirmAction?.title}</b>? It will no
              longer be visible to visitors on the live site.
            </>
          )
        }
        confirmLabel={confirmAction?.action === "delete" ? "Delete" : "Archive"}
        variant={confirmAction?.action === "delete" ? "danger" : "warning"}
        typeToConfirm={confirmAction?.action === "delete" ? "DELETE" : undefined}
      />

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
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-xs font-semibold text-night shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
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
