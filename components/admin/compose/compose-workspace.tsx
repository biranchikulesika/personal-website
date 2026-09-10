"use client";

import {
  addMediaAction,
  deleteNoteAction,
  deletePostAction,
  saveNoteAction,
  saveNowEntryAction,
  savePostAction,
} from "@/app/admin/actions";
import type {
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
  Persona,
} from "@/lib/types";
import {
  markdownToPostSections,
  sectionsToMarkdown,
  slugify,
} from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastView } from "@/components/ui/toast-view";
import { NoSearchResults, NoContentState } from "@/components/ui/states";
import { EmbedInsertModal } from "../mdx-editor/embed-insert-modal";
import { MDXPreview } from "../mdx-editor/mdx-preview";
import { MediaInsertModal } from "../mdx-editor/media-insert-modal";
import { ComponentLibrarySidebar } from "./component-library-sidebar";
import { PublishDrawer } from "./publish-drawer";

interface DocumentTab {
  id: string;
  docType: "post" | "note" | "now";
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  persona?: Persona;
  status: "published" | "unpublished";
  tags: string[];
  coverImage?: string;
  content: string;
  isDirty: boolean;
  rawPost?: BlogPost;
  rawNote?: NoteItem;
  rawNow?: NowEntry;
  location?: string;
}

interface ComposeWorkspaceProps {
  initialDocument?: {
    docType: "post" | "note" | "now";
    slug?: string;
    post?: BlogPost;
    note?: NoteItem;
    now?: NowEntry;
  };
  allPosts?: BlogPost[];
  allNotes?: NoteItem[];
  allNow?: NowEntry[];
  allBooks?: BookItem[];
  mediaItems: MediaItem[];
}

export function ComposeWorkspace({
  initialDocument,
  allPosts = [],
  allNotes = [],
  allNow = [],
  allBooks = [],
  mediaItems,
}: ComposeWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabCounterRef = useRef(0);

  // Create initial tab based on passed document
  const createInitialTab = (): DocumentTab => {
    if (initialDocument?.post) {
      const p = initialDocument.post;
      return {
        id: `tab-post-${p.slug}`,
        docType: "post",
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle || "",
        description: p.description,
        persona: "builder",
        status: p.status || "published",
        tags: p.tags || ["essay"],
        coverImage: p.coverImage,
        content: sectionsToMarkdown(p.intro, p.sections),
        isDirty: false,
        rawPost: p,
      };
    }
    if (initialDocument?.note) {
      const n = initialDocument.note;
      return {
        id: `tab-note-${n.slug}`,
        docType: "note",
        slug: n.slug,
        title: n.title,
        subtitle: n.subtitle || "",
        description: n.description,
        persona: n.persona,
        status: n.status || "published",
        tags: n.tags || ["note"],
        coverImage: n.coverImage,
        content: n.content.join("\n\n"),
        isDirty: false,
        rawNote: n,
      };
    }
    if (initialDocument?.now) {
      const e = initialDocument.now;
      return {
        id: `tab-now-${e.id}`,
        docType: "now",
        slug: e.id,
        title: e.title,
        subtitle: "",
        description: "",
        status: "published",
        tags: [],
        content: e.content,
        isDirty: false,
        rawNow: e,
        location: e.location || "",
      };
    }

    const docType = initialDocument?.docType || "post";
    if (docType === "now") {
      tabCounterRef.current += 1;
      const n = tabCounterRef.current;
      const defaultNowTitle = new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      return {
        id: `tab-new-now-${n}`,
        docType: "now",
        slug: slugify(defaultNowTitle),
        title: defaultNowTitle,
        subtitle: "",
        description: "",
        status: "published",
        tags: [],
        content:
          "A short note on what you are reading, exploring, and thinking about this month.",
        isDirty: true,
        location: "",
      };
    }

    const isNote = docType === "note";
    tabCounterRef.current += 1;
    const n = tabCounterRef.current;
    return {
      id: `tab-new-${n}`,
      docType: isNote ? "note" : "post",
      slug: isNote ? "new-note" : "new-essay",
      title: isNote ? "Untitled Note" : "Untitled Essay",
      subtitle: "",
      description: "",
      persona: isNote ? "thinker" : "builder",
      status: "published",
      tags: isNote ? ["note"] : ["essay"],
      coverImage: undefined,
      content: isNote
        ? "An atomic note on tools and focus.\n\n> [!TIP]\n> Keep notes concise and focused."
        : "An opening reflection on technology, craft, and ideas.\n\n## The First Principle\n\nSoftware should feel like an orderly workshop.\n\n> [!NOTE]\n> Taking the slower path builds more resilient systems.",
      isDirty: false,
    };
  };

  const [tabs, setTabs] = useState<DocumentTab[]>([createInitialTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

  // Active tab pointer
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // UI state
  const [view, setView] = useState<"write" | "preview" | "split">("write");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPublishDrawerOpen, setIsPublishDrawerOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [embedModalKind, setEmbedModalKind] = useState<
    "book" | "post" | "note"
  >("book");
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [draftsSearchQuery, setDraftsSearchQuery] = useState("");
  const { message: toastMessage, showToast } = useToast();



  // Update active tab property helper
  const updateActiveTab = useCallback(
    (updates: Partial<DocumentTab>) => {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId ? { ...tab, isDirty: true, ...updates } : tab,
        ),
      );
    },
    [activeTabId],
  );

  // Keyboard shortcut listener for Ctrl+S / Cmd+S
  // Use a ref so the effect only registers/unregisters the listener once,
  // while always calling the latest save handler.
  const handleSaveRef = useRef(handleSaveDocument);
  handleSaveRef.current = handleSaveDocument;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveRef.current("unpublished");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Formatting helpers for text insertion
  function insertFormat(prefix: string, suffix = "") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = activeTab.content;
    const selected = current.slice(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix || prefix}`;
    const nextContent =
      current.slice(0, start) + replacement + current.slice(end);

    updateActiveTab({ content: nextContent });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 4),
      );
    }, 0);
  }

  function insertBlock(blockText: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = activeTab.content;
    const nextContent =
      current.slice(0, start) + `\n\n${blockText}\n\n` + current.slice(end);

    updateActiveTab({ content: nextContent });
    setTimeout(() => {
      ta.focus();
    }, 0);
  }

  // Create / Close Tab
  function handleNewTab() {
    const newId = `tab-doc-${Date.now()}`;
    const newTab: DocumentTab = {
      id: newId,
      docType: "post",
      slug: `untitled-${tabs.length + 1}`,
      title: `Untitled Draft ${tabs.length + 1}`,
      subtitle: "",
      description: "",
      persona: "builder",
      status: "published",
      tags: ["essay"],
      content: "Write something thoughtful here...",
      isDirty: true,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  }

  function handleCloseTab(idToClose: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (tabs.length === 1) {
      showToast("Cannot close the only open tab.");
      return;
    }
    const nextTabs = tabs.filter((t) => t.id !== idToClose);
    setTabs(nextTabs);
    if (activeTabId === idToClose) {
      setActiveTabId(nextTabs[0].id);
    }
  }

  // Open existing post or note from Drafts Modal
  function handleOpenExistingDocument(
    doc: BlogPost | NoteItem,
    type: "post" | "note",
  ) {
    setIsDraftsModalOpen(false);
    const existing = tabs.find(
      (t) => t.slug === doc.slug && t.docType === type,
    );
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    if (type === "post") {
      const p = doc as BlogPost;
      const tab: DocumentTab = {
        id: `tab-post-${p.slug}`,
        docType: "post",
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle || "",
        description: p.description,
        persona: "builder",
        status: p.status || "published",
        tags: p.tags || ["essay"],
        coverImage: p.coverImage,
        content: sectionsToMarkdown(p.intro, p.sections),
        isDirty: false,
        rawPost: p,
      };
      setTabs((prev) => [...prev, tab]);
      setActiveTabId(tab.id);
    } else {
      const n = doc as NoteItem;
      const tab: DocumentTab = {
        id: `tab-note-${n.slug}`,
        docType: "note",
        slug: n.slug,
        title: n.title,
        subtitle: n.subtitle || "",
        description: n.description,
        persona: n.persona,
        status: n.status || "published",
        tags: n.tags || ["note"],
        coverImage: n.coverImage,
        content: n.content.join("\n\n"),
        isDirty: false,
        rawNote: n,
      };
      setTabs((prev) => [...prev, tab]);
      setActiveTabId(tab.id);
    }
  }

  // Save Document to database
  async function handleSaveDocument(
    statusToSet: "published" | "unpublished" = "published",
  ) {
    const isNowDoc = activeTab.docType === "now";
    const effectiveNowTitle =
      activeTab.title.trim() || "Timeline Update";

    if (!activeTab.title.trim() && !isNowDoc) {
      showToast("Please provide a document title before saving.");
      return;
    }

    const cleanSlug = slugify(activeTab.slug || activeTab.title);

    startTransition(async () => {
      if (activeTab.docType === "post") {
        // Check slug collision against other items
        const isTakenByPost = allPosts.some(
          (p) => p.slug === cleanSlug && p.slug !== activeTab.rawPost?.slug,
        );
        const isTakenByNote = allNotes.some((n) => n.slug === cleanSlug);
        const isTakenByBook = allBooks.some((b) => b.slug === cleanSlug);
        if (isTakenByPost || isTakenByNote || isTakenByBook) {
          showToast(
            `Slug "${cleanSlug}" is already in use. Please choose a unique slug.`,
          );
          return;
        }

        // If existing post had a different slug, delete old slug
        if (activeTab.rawPost?.slug && activeTab.rawPost.slug !== cleanSlug) {
          await deletePostAction(activeTab.rawPost.slug);
        }

        const { intro, sections } = markdownToPostSections(activeTab.content);
        const postPayload: BlogPost = {
          title: activeTab.title,
          slug: cleanSlug,
          subtitle: activeTab.subtitle || undefined,
          description:
            activeTab.description ||
            (intro[0] ? intro[0].slice(0, 150) : activeTab.title),
          tags: activeTab.tags.length > 0 ? activeTab.tags : ["essay"],
          publishedAt:
            activeTab.rawPost?.publishedAt ||
            new Date().toISOString().split("T")[0],
          lastEditedAt: new Date().toISOString().split("T")[0],
          targetAudience: "Curious readers and builders",
          intro:
            intro.length > 0
              ? intro
              : [
                  activeTab.subtitle ||
                    activeTab.description ||
                    activeTab.title,
                ],
          sections:
            sections.length > 0
              ? sections
              : [
                  {
                    id: "sec-1",
                    heading: "Overview",
                    paragraphs: [activeTab.content || ""],
                  },
                ],
          books: activeTab.rawPost?.books || [],
          coverImage: activeTab.coverImage,
          status: statusToSet,
        };

        const res = await savePostAction(postPayload, activeTab.persona);
        if (res.success && res.post) {
          updateActiveTab({
            slug: cleanSlug,
            status: statusToSet,
            rawPost: res.post,
            isDirty: false,
          });
          setIsPublishDrawerOpen(false);
          showToast(`Essay "${activeTab.title}" saved successfully!`);
        } else {
          showToast(res.error || "Failed to save essay");
        }
      } else if (activeTab.docType === "now") {
        // Append-only timeline: always create a new row so previous entries are preserved.
        const nowPayload: NowEntry = {
          id: `now-${Date.now()}`,
          title: effectiveNowTitle,
          content: activeTab.content.trim(),
          location: activeTab.location?.trim() || undefined,
          status: statusToSet,
        };

        const res = await saveNowEntryAction(nowPayload);
        if (res.success && res.entry) {
          updateActiveTab({
            rawNow: undefined,
            isDirty: false,
            content: "",
          });
          setIsPublishDrawerOpen(false);
          showToast(`Now entry added to the timeline.`);
        } else {
          showToast(res.error || "Failed to save now entry");
        }
      } else {
        // Note collision check
        const isTakenByNote = allNotes.some(
          (n) => n.slug === cleanSlug && n.slug !== activeTab.rawNote?.slug,
        );
        const isTakenByPost = allPosts.some((p) => p.slug === cleanSlug);
        const isTakenByBook = allBooks.some((b) => b.slug === cleanSlug);
        if (isTakenByNote || isTakenByPost || isTakenByBook) {
          showToast(
            `Slug "${cleanSlug}" is already in use. Please choose a unique slug.`,
          );
          return;
        }

        // If existing note had a different slug, delete old slug
        if (activeTab.rawNote?.slug && activeTab.rawNote.slug !== cleanSlug) {
          await deleteNoteAction(activeTab.rawNote.slug);
        }

        const paragraphs = activeTab.content
          .split("\n\n")
          .map((p) => p.trim())
          .filter(Boolean);

        const notePayload: NoteItem = {
          id: activeTab.rawNote?.id || `note-${Date.now()}`,
          title: activeTab.title,
          slug: cleanSlug,
          subtitle: activeTab.subtitle || undefined,
          description:
            activeTab.description ||
            activeTab.subtitle ||
            (paragraphs[0] ? paragraphs[0].slice(0, 120) : activeTab.title),
          content: paragraphs.length > 0 ? paragraphs : [activeTab.title],
          date:
            activeTab.rawNote?.date ||
            new Date().toISOString().split("T")[0],
          persona: activeTab.persona || "builder",
          tags: activeTab.tags.length > 0 ? activeTab.tags : ["note"],
          coverImage: activeTab.coverImage,
          status: statusToSet,
        };

        const res = await saveNoteAction(notePayload);
        if (res.success && res.note) {
          updateActiveTab({
            slug: cleanSlug,
            status: statusToSet,
            rawNote: res.note,
            isDirty: false,
          });
          setIsPublishDrawerOpen(false);
          showToast(`Note "${activeTab.title}" saved successfully!`);
        } else {
          showToast(res.error || "Failed to save note");
        }
      }
    });
  }

  // Check if active document has unpublished / unsaved modifications
  const hasUnpublishedChanges = (() => {
    if (activeTab.docType === "post" && activeTab.rawPost) {
      const origContent = sectionsToMarkdown(
        activeTab.rawPost.intro,
        activeTab.rawPost.sections,
      );
      return (
        activeTab.isDirty ||
        activeTab.content !== origContent ||
        activeTab.title !== activeTab.rawPost.title ||
        (activeTab.subtitle || "") !== (activeTab.rawPost.subtitle || "") ||
        (activeTab.description || "") !== (activeTab.rawPost.description || "") ||
        (activeTab.persona || "builder") !== (activeTab.rawPost.persona || "builder") ||
        (activeTab.status || "published") !== (activeTab.rawPost.status || "published") ||
        (activeTab.tags || []).join(",") !== (activeTab.rawPost.tags || []).join(",") ||
        (activeTab.coverImage || "") !== (activeTab.rawPost.coverImage || "") ||
        activeTab.slug !== activeTab.rawPost.slug
      );
    }
    if (activeTab.docType === "note" && activeTab.rawNote) {
      const origContent = activeTab.rawNote.content.join("\n\n");
      return (
        activeTab.isDirty ||
        activeTab.content !== origContent ||
        activeTab.title !== activeTab.rawNote.title ||
        (activeTab.subtitle || "") !== (activeTab.rawNote.subtitle || "") ||
        (activeTab.description || "") !== (activeTab.rawNote.description || "") ||
        (activeTab.persona || "thinker") !== (activeTab.rawNote.persona || "thinker") ||
        (activeTab.status || "published") !== (activeTab.rawNote.status || "published") ||
        (activeTab.tags || []).join(",") !== (activeTab.rawNote.tags || []).join(",") ||
        (activeTab.coverImage || "") !== (activeTab.rawNote.coverImage || "") ||
        activeTab.slug !== activeTab.rawNote.slug
      );
    }
    if (activeTab.docType === "now" && activeTab.rawNow) {
      return (
        activeTab.isDirty ||
        activeTab.title !== activeTab.rawNow.title ||
        activeTab.content !== activeTab.rawNow.content
      );
    }
    return activeTab.isDirty;
  })();

  // Save/Publish are only meaningful when there is something pending to persist,
  // or (for publish) when the active document is a synced draft awaiting release.
  const canSaveDraft = hasUnpublishedChanges && !isPending;
  const canPublish =
    !isPending && (hasUnpublishedChanges || activeTab.status === "unpublished");

  // Discard handler: revert active tab back to original published / saved state
  function handleDiscardChanges() {
    if (activeTab.docType === "post" && activeTab.rawPost) {
      const p = activeTab.rawPost;
      updateActiveTab({
        title: p.title,
        subtitle: p.subtitle || "",
        description: p.description,
        persona: "builder",
        status: p.status || "published",
        tags: p.tags || ["essay"],
        coverImage: p.coverImage,
        slug: p.slug,
        content: sectionsToMarkdown(p.intro, p.sections),
        isDirty: false,
      });
      showToast(`Unpublished changes discarded for "${p.title}". Reverted to published version.`);
    } else if (activeTab.docType === "note" && activeTab.rawNote) {
      const n = activeTab.rawNote;
      updateActiveTab({
        title: n.title,
        subtitle: n.subtitle || "",
        description: n.description,
        persona: n.persona,
        status: n.status || "published",
        tags: n.tags || ["note"],
        coverImage: n.coverImage,
        slug: n.slug,
        content: n.content.join("\n\n"),
        isDirty: false,
      });
      showToast(`Unpublished changes discarded for "${n.title}". Reverted to published version.`);
    } else if (activeTab.docType === "now" && activeTab.rawNow) {
      const now = activeTab.rawNow;
      updateActiveTab({
        title: now.title,
        content: now.content,
        isDirty: false,
      });
      showToast(`Unpublished changes discarded for "${now.title}".`);
    } else {
      const isNote = activeTab.docType === "note";
      const isNow = activeTab.docType === "now";
      if (isNow) {
        updateActiveTab({
          title: "",
          subtitle: "",
          description: "",
          content: "A short note on what you are reading, exploring, and thinking about this month.",
          isDirty: false,
        });
      } else {
        updateActiveTab({
          slug: isNote ? "new-note" : "new-essay",
          title: isNote ? "Untitled Note" : "Untitled Essay",
          subtitle: "",
          description: "",
          persona: isNote ? "thinker" : "builder",
          status: "published",
          tags: isNote ? ["note"] : ["essay"],
          coverImage: undefined,
          content: isNote
            ? "An atomic note on tools and focus.\n\n> [!TIP]\n> Keep notes concise and focused."
            : "An opening reflection on technology, craft, and ideas.\n\n## The First Principle\n\nSoftware should feel like an orderly workshop.\n\n> [!NOTE]\n> Taking the slower path builds more resilient systems.",
          isDirty: false,
        });
      }
      showToast("Unsaved changes discarded.");
    }
    setIsDiscardModalOpen(false);
    setIsPublishDrawerOpen(false);
  }

  // Word count & reading time metrics
  const wordCount = activeTab.content.trim()
    ? activeTab.content.trim().split(/\s+/).length
    : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Combine items for Drafts modal search
  const allDraftItems = [
    ...allPosts.map((p) => ({ ...p, itemKind: "post" as const })),
    ...allNotes.map((n) => ({ ...n, itemKind: "note" as const })),
  ].filter((item) => {
    const q = draftsSearchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-ink text-paper/80 font-sans">
      {/* Toast Notification */}
      <ToastView message={toastMessage} />

      {/* 1. Multi-Tab Bar with + button and Folder Icon */}
      <div className="flex h-8.75 shrink-0 bg-ink border-b border-tinted/20 overflow-x-auto relative select-none">
        {/* Navigation back to Admin */}
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-3.5 h-full text-xs font-medium text-ink-soft hover:text-paper hover:bg-tinted/10 border-r border-tinted/20 transition-colors shrink-0"
          title="Back to Admin Dashboard"
        >
          <span>←</span>
          <span>Admin</span>
        </Link>

        {/* Tab List */}
        {tabs.map((tab) => {
          const isSelected = tab.id === activeTabId;
          const displayTabName = `${slugify(
            tab.docType === "now"
              ? tab.title || "untitled"
              : tab.slug || tab.title || "untitled",
          )}.mdx`;

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center h-full px-3.5 cursor-pointer min-w-37.5 max-w-60 group transition-colors border-r border-tinted/20 text-xs ${
                isSelected
                  ? "bg-night-soft text-paper font-medium"
                  : "bg-ink/80 text-ink-soft hover:bg-night-soft hover:text-paper/90"
              }`}
            >
              <span
                className={`mr-2 shrink-0 text-xs ${isSelected ? "text-accent" : "text-ink-soft"}`}
              >
                {tab.docType === "post"
                  ? "📄"
                  : tab.docType === "note"
                    ? "📝"
                    : "⏰"}
              </span>
              <span className="truncate flex-1 font-mono text-[11px]">
                {displayTabName}
              </span>

              {isPending && isSelected ? (
                <span className="h-2 w-2 rounded-full border border-sea-blue border-t-transparent animate-spin ml-1.5 shrink-0" />
              ) : tab.isDirty ? (
                <span
                  className="text-accent font-mono text-xs ml-1.5 shrink-0"
                  title="Unsaved changes"
                >
                  ●
                </span>
              ) : null}

              <button
                type="button"
                onClick={(e) => handleCloseTab(tab.id, e)}
                className="ml-2 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-tinted/20 hover:text-paper transition-opacity shrink-0"
                title="Close Tab"
              >
                ✕
              </button>
            </div>
          );
        })}

        {/* + Button: New Tab */}
        <button
          type="button"
          onClick={handleNewTab}
          className="flex h-full items-center px-3 text-ink-soft hover:bg-tinted/10 hover:text-paper transition-colors"
          title="New Draft (+)"
        >
          <span className="text-base font-normal">+</span>
        </button>

        {/* Folder Icon: Open Drafts Modal */}
        <button
          type="button"
          onClick={() => setIsDraftsModalOpen(true)}
          className="flex h-full items-center px-3 text-ink-soft hover:bg-tinted/10 hover:text-paper transition-colors text-xs"
          title="Open Existing Draft or Note (📁)"
        >
          <span>📁</span>
        </button>

        <div className="flex-1 bg-ink" />
      </div>

      {/* 2. Unified Toolbar with Split Preview, Save, Publish */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-tinted/20 bg-ink/95 px-4 overflow-x-auto select-none">
        {/* Left Formatting Group */}
        <div className="flex items-center gap-4">
          {/* Bold & Italic */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => insertFormat("**")}
              className="rounded p-1.5 text-xs text-paper/80 hover:bg-tinted/10 hover:text-paper transition-colors"
              title="Bold (Cmd+B)"
            >
              <b>B</b>
            </button>
            <button
              type="button"
              onClick={() => insertFormat("*")}
              className="rounded p-1.5 text-xs text-paper/80 hover:bg-tinted/10 hover:text-paper transition-colors"
              title="Italic (Cmd+I)"
            >
              <i>I</i>
            </button>
          </div>

          <div className="h-4 w-px bg-tinted/20" />

          {/* Link */}
          <button
            type="button"
            onClick={() => insertFormat("[", "](https://)")}
            className="rounded p-1.5 text-xs text-paper/80 hover:bg-tinted/10 hover:text-paper transition-colors"
            title="Link (Cmd+K)"
          >
            🔗
          </button>

          <div className="h-4 w-px bg-tinted/20" />

          {/* Headings */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => insertBlock("## Section Heading\n")}
              className="rounded p-1.5 text-xs text-paper/80 hover:bg-tinted/10 hover:text-paper transition-colors font-semibold"
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertBlock("### Subsection\n")}
              className="rounded p-1.5 text-xs text-paper/80 hover:bg-tinted/10 hover:text-paper transition-colors font-semibold"
              title="Heading 3"
            >
              H3
            </button>
          </div>

          <div className="h-4 w-px bg-tinted/20" />

          {/* Images & Media */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() =>
                insertBlock('![Alt Text](https://image-url.com/image.jpg "Image Caption")')
              }
              className="rounded p-1.5 text-xs text-paper/80 hover:bg-tinted/10 hover:text-paper transition-colors"
              title="Insert Image URL"
            >
              🖼
            </button>
            <button
              type="button"
              onClick={() => setIsMediaModalOpen(true)}
              className="rounded p-1.5 text-xs text-paper/80 hover:bg-tinted/10 hover:text-accent transition-colors"
              title="Media Library Asset"
            >
              📁 Media
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded p-1.5 text-xs text-paper/80 hover:bg-tinted/10 hover:text-paper transition-colors"
              title="Upload Local Image"
            >
              ☁ Upload
            </button>
          </div>
        </div>

        {/* Hidden File Input for Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = async () => {
                const dataUrl = reader.result as string;
                try {
                  const mediaItem: MediaItem = {
                    id: `media-${Date.now()}`,
                    name: file.name,
                    src: dataUrl,
                    alt: file.name.replace(/\.[^.]+$/, ""),
                    size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                    uploadedAt: new Date().toISOString().split("T")[0],
                    tag: "atmosphere",
                  };
                  const res = await addMediaAction(mediaItem);
                  const imgUrl =
                    res.success && res.media ? res.media.src : dataUrl;
                  insertBlock(
                    `![${file.name}](${imgUrl} "${file.name}")`,
                  );
                } catch {
                  insertBlock(
                    `![${file.name}](${dataUrl} "${file.name}")`,
                  );
                }
              };
              reader.readAsDataURL(file);
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />

        {/* Right Placement: View Toggle, Discard, Save Draft, Publish Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Write / Preview View Toggle */}
          <div className="flex items-center rounded-md border border-tinted/20 bg-ink/70 p-0.5 text-xs font-medium select-none">
            {(["write", "split", "preview"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`px-2.5 py-1 rounded transition-colors capitalize ${
                  view === mode
                    ? "bg-night-soft text-accent"
                    : "text-ink-soft hover:bg-tinted/10 hover:text-paper"
                }`}
                title={`Switch to ${mode} view`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Discard Unpublished Changes Button */}
          <button
            type="button"
            disabled={!hasUnpublishedChanges}
            onClick={() => setIsDiscardModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border border-tinted/20 bg-night-soft text-paper/70 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/40 disabled:opacity-30 disabled:pointer-events-none"
            title={
              hasUnpublishedChanges
                ? "Discard unpublished changes and revert to published version"
                : "No unpublished edits to discard"
            }
          >
            <span>↺</span>
            <span>Discard</span>
          </button>

          {/* Save Draft Button with Pulse / Check status */}
          <button
            type="button"
            disabled={!canSaveDraft}
            onClick={() => handleSaveDocument("unpublished")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors border ${
              activeTab.isDirty
                ? "border-accent/40 bg-night-soft hover:bg-tinted/10 text-accent"
                : "border-tinted/20 bg-night-soft hover:bg-tinted/10 text-paper/80"
            } disabled:opacity-50`}
            title="Save Draft (Ctrl+S / Cmd+S)"
          >
            {isPending ? (
              <>
                <span className="h-2 w-2 rounded-full border border-sea-blue border-t-transparent animate-spin" />
                <span>Saving...</span>
              </>
            ) : activeTab.isDirty ? (
              <>
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span>Save Draft</span>
              </>
            ) : (
              <>
                <span className="text-accent-green">✓</span>
                <span>Saved</span>
              </>
            )}
          </button>

          {/* Publish Live Button */}
          <button
            type="button"
            disabled={!canPublish}
            onClick={() => setIsPublishDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-accent hover:bg-accent-hover text-paper px-3.5 py-1 text-xs font-bold transition-all shadow-sm disabled:bg-night-soft disabled:text-ink-soft disabled:shadow-none disabled:cursor-not-allowed"
          >
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex flex-1 min-h-0 relative">
        <div className="flex-1 min-w-0 flex flex-col relative h-full">
          {/* Breadcrumbs Row: Persona + Title */}
          <div className="flex items-center min-h-8.5 bg-night-soft px-4 text-paper/80 shrink-0 text-xs font-sans border-b border-tinted/20 z-10">
            {activeTab.docType !== "now" && (
              <>
                <select
                  value={activeTab.persona}
                  onChange={(e) =>
                    updateActiveTab({ persona: e.target.value as Persona })
                  }
                  className="bg-transparent text-ink-soft hover:text-paper capitalize font-mono text-[11px] focus:outline-none cursor-pointer"
                >
                  <option value="builder" className="bg-ink text-paper">
                    builder
                  </option>
                  <option value="operator" className="bg-ink text-paper">
                    operator
                  </option>
                  <option value="thinker" className="bg-ink text-paper">
                    thinker
                  </option>
                  <option value="wanderer" className="bg-ink text-paper">
                    wanderer
                  </option>
                </select>
                <span className="mx-2 opacity-40">›</span>
              </>
            )}
            <input
              type="text"
              value={activeTab.title}
              onChange={(e) => {
                const title = e.target.value;
                const prevDefaultSlug = slugify(activeTab.title);
                const isAutoSlug =
                  !activeTab.slug ||
                  activeTab.slug === "new-essay" ||
                  activeTab.slug === "new-note" ||
                  activeTab.slug.startsWith("untitled") ||
                  activeTab.slug === prevDefaultSlug;

                updateActiveTab({
                  title,
                  slug: isAutoSlug ? slugify(title) : activeTab.slug,
                });
              }}
              placeholder={
                activeTab.docType === "now"
                  ? "Now Entry Title..."
                  : "Post Title..."
              }
              className="flex-1 bg-transparent border-none outline-none text-paper font-medium placeholder-ink-soft/50 py-1 text-xs"
            />
            {activeTab.docType !== "now" && (
              <div
                className="ml-2 flex items-center gap-1 rounded-md border border-tinted/20 bg-ink/70 px-2 py-0.5 text-[11px] font-mono text-ink-soft focus-within:border-accent/40 focus-within:text-paper shrink-0"
                title="Edit Slug / Permalink"
              >
                <span className="select-none text-ink-soft/60">
                  {activeTab.docType === "post" ? "/p/" : "/n/"}
                </span>
                <input
                  type="text"
                  value={activeTab.slug}
                  onChange={(e) =>
                    updateActiveTab({ slug: slugify(e.target.value) })
                  }
                  placeholder="slug"
                  className="w-24 sm:w-36 focus:w-48 bg-transparent border-none outline-none text-paper font-mono placeholder-ink-soft/40 transition-all text-[11px]"
                />
              </div>
            )}
          </div>

          {/* Subtitle Row */}
          <div className="flex items-center min-h-7.5 bg-ink px-4 text-paper/80 shrink-0 border-b border-tinted/20 justify-between">
            {activeTab.docType === "now" ? (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-wider text-ink-soft shrink-0">
                  Location
                </span>
                <input
                  type="text"
                  value={activeTab.location || ""}
                  onChange={(e) => updateActiveTab({ location: e.target.value })}
                  placeholder="e.g. Bhubaneswar, Odisha"
                  maxLength={200}
                  className="bg-transparent border-none outline-none text-paper/70 placeholder-ink-soft/50 py-1 text-xs flex-1 min-w-0"
                />
              </div>
            ) : (
              <input
                type="text"
                value={activeTab.subtitle}
                onChange={(e) => updateActiveTab({ subtitle: e.target.value })}
                placeholder="Subtitle (optional)..."
                className="flex-1 bg-transparent border-none outline-none text-paper/70 placeholder-ink-soft/50 py-1 text-xs italic"
              />
            )}
            {activeTab.docType !== "now" && (
              <button
                type="button"
                onClick={() => setIsPublishDrawerOpen(true)}
                className="text-sm text-accent hover:text-accent-hover transition-colors ml-3 shrink-0 p-1 hover:bg-tinted/10 rounded"
                title="AI Summary"
              >
                ✨
              </button>
            )}
          </div>

          {/* Editor & Preview (full-width write, preview, or side-by-side split) */}
          <div className="flex-1 flex flex-row relative min-h-0 overflow-hidden divide-x divide-tinted/20">
            {(view === "write" || view === "split") && (
              <div
                className={`relative h-full min-w-0 bg-ink ${
                  view === "split" ? "w-1/2" : "w-full"
                }`}
              >
                <textarea
                  ref={textareaRef}
                  value={activeTab.content}
                  onChange={(e) => updateActiveTab({ content: e.target.value })}
                  placeholder="Write your article in Markdown / MDX..."
                  className="w-full h-full resize-none bg-ink p-6 font-mono text-xs leading-relaxed text-paper/90 focus:outline-none selection:bg-accent/30"
                  spellCheck={false}
                />
              </div>
            )}
            {(view === "preview" || view === "split") && (
              <div
                className={`relative h-full min-w-0 overflow-hidden bg-night ${
                  view === "split" ? "w-1/2" : "w-full"
                }`}
              >
                <MDXPreview
                  content={activeTab.content}
                  title={activeTab.title}
                  subtitle={activeTab.subtitle}
                  persona={activeTab.persona || "builder"}
                  tags={activeTab.tags}
                  books={activeTab.rawPost?.books}
                  targetAudience={activeTab.rawPost?.targetAudience}
                  docType={activeTab.docType}
                  location={activeTab.location}
                  className="h-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Grouped Component Library matching Develop Branch */}
        <ComponentLibrarySidebar
          onInsert={(snippet) => insertBlock(snippet)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenMediaPicker={() => setIsMediaModalOpen(true)}
          onOpenEmbedPicker={(kind) => {
            setEmbedModalKind(kind);
            setIsEmbedModalOpen(true);
          }}
        />
      </div>

      {/* 4. Bottom Status Bar */}
      <div className="flex h-6.5 items-center justify-between border-t border-tinted/20 bg-ink px-4 text-[11px] text-ink-soft select-none">
        <div className="flex items-center gap-4 font-mono">
          <span className="capitalize text-paper/80">
            {activeTab.docType === "now"
              ? "now • timeline entry"
              : `${activeTab.persona} • ${activeTab.docType}`}
          </span>
          <span className="text-tinted/30">|</span>
          <span
            className={activeTab.isDirty ? "text-accent" : "text-accent-green"}
          >
            {activeTab.isDirty ? "● Unsaved" : "✓ Synced"}
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <span>{wordCount} words</span>
          <span>{readingTime} mins</span>
          <span>UTF-8</span>
          <span>MDX</span>
        </div>
      </div>

      {/* Slide-over Publish Drawer */}
      <PublishDrawer
        isOpen={isPublishDrawerOpen}
        onClose={() => setIsPublishDrawerOpen(false)}
        title={activeTab.title}
        slug={activeTab.slug}
        onSlugChange={(newSlug) => updateActiveTab({ slug: newSlug })}
        description={activeTab.description}
        onDescriptionChange={(desc) => updateActiveTab({ description: desc })}
        persona={activeTab.persona || "builder"}
        onPersonaChange={(p) => updateActiveTab({ persona: p })}
        status={activeTab.status}
        onStatusChange={(s) => updateActiveTab({ status: s })}
        tags={activeTab.tags}
        onTagsChange={(tags) => updateActiveTab({ tags })}
        coverImage={activeTab.coverImage}
        onCoverImageChange={(url) => updateActiveTab({ coverImage: url })}
        content={activeTab.content}
        wordCount={wordCount}
        readingTime={readingTime}
        mediaItems={mediaItems}
        onSave={handleSaveDocument}
        isSaving={isPending}
        docType={activeTab.docType}
        location={activeTab.location}
        onLocationChange={(location) => updateActiveTab({ location })}
        hasUnpublishedChanges={hasUnpublishedChanges}
        onDiscard={() => {
          setIsPublishDrawerOpen(false);
          setIsDiscardModalOpen(true);
        }}
      />

      {/* Media Asset Picker Modal */}
      <MediaInsertModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        mediaItems={mediaItems}
        onSelect={(imgMd) => insertBlock(imgMd)}
      />

      {/* Embed Content Picker Modal */}
      <EmbedInsertModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        books={allBooks}
        posts={allPosts}
        notes={allNotes}
        initialType={embedModalKind}
        onSelect={(snippet) => insertBlock(snippet)}
      />

      {/* Discard Confirmation Modal */}
      {isDiscardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-tinted/20 bg-ink p-6 shadow-2xl space-y-4 text-paper">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="text-xl">↺</span>
              <h3 className="text-base font-semibold text-paper">
                Discard Unpublished Changes?
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-ink-soft">
              Are you sure you want to discard all unpublished edits for{" "}
              <strong className="text-paper font-semibold">
                “{activeTab.title || "Untitled"}”
              </strong>
              ?
              {activeTab.rawPost || activeTab.rawNote || activeTab.rawNow
                ? " All modifications will be reverted back to the published version. This action cannot be undone."
                : " All unsaved draft content will be reset. This action cannot be undone."}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-tinted/20">
              <button
                type="button"
                onClick={() => setIsDiscardModalOpen(false)}
                className="rounded-lg border border-tinted/20 bg-night-soft hover:bg-tinted/10 px-4 py-2 text-xs font-medium text-paper/80 transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="rounded-lg bg-rose-600 hover:bg-rose-700 text-paper px-4 py-2 text-xs font-bold transition-colors shadow-sm"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Open Existing Drafts / Notes Modal (Triggered by Folder Icon) */}
      {isDraftsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-tinted/20 bg-ink shadow-2xl flex flex-col max-h-[80vh] overflow-hidden text-paper/90">
            <div className="flex items-center justify-between p-4 border-b border-tinted/20 bg-night-soft">
              <div className="flex items-center gap-2">
                <span className="text-base">📁</span>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-paper">
                  Open Existing Draft or Note
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftsModalOpen(false)}
                className="text-ink-soft hover:text-paper p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-tinted/20">
              <input
                type="text"
                placeholder="Search essays or notes by title..."
                value={draftsSearchQuery}
                onChange={(e) => setDraftsSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-tinted/20 bg-night-soft px-3.5 py-2 text-xs text-paper placeholder-ink-soft/50 focus:border-tinted/40 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {allDraftItems.length === 0 ? (
                draftsSearchQuery ? (
                  <NoSearchResults
                    compact
                    query={draftsSearchQuery}
                    onReset={() => setDraftsSearchQuery('')}
                  />
                ) : (
                  <NoContentState
                    compact
                    title="No drafts found"
                    description="Create a new document to begin writing."
                  />
                )
              ) : (
                allDraftItems.map((item) => (
                  <button
                    key={`${item.itemKind}-${item.slug}`}
                    type="button"
                    onClick={() =>
                      handleOpenExistingDocument(item, item.itemKind)
                    }
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-night-soft/60 hover:bg-night-soft border border-transparent hover:border-tinted/20 text-left transition-all group"
                  >
                    <div className="flex flex-col min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          {item.itemKind === "post" ? "📄" : "📝"}
                        </span>
                        <span className="text-xs font-semibold text-paper/90 group-hover:text-accent truncate">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-soft truncate mt-0.5">
                        {item.description || "No description"}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-ink-soft uppercase shrink-0">
                      {item.itemKind} ↗
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
