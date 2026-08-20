'use client';

import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BlogPost, BookItem, MediaItem, NoteItem, NowEntry, Persona, PostSection } from '@/lib/types';
import { savePostAction, saveNoteAction, saveNowEntryAction } from '@/app/admin/actions';
import { MDXPreview } from '../mdx-editor/mdx-preview';
import { MediaInsertModal } from '../mdx-editor/media-insert-modal';
import { EmbedInsertModal } from '../mdx-editor/embed-insert-modal';
import { ComponentLibrarySidebar } from './component-library-sidebar';
import { PublishDrawer } from './publish-drawer';

interface DocumentTab {
  id: string;
  docType: 'post' | 'note' | 'now';
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  persona?: Persona;
  status: 'published' | 'unpublished';
  tags: string[];
  coverImage?: string;
  content: string;
  isDirty: boolean;
  rawPost?: BlogPost;
  rawNote?: NoteItem;
  rawNow?: NowEntry;
  date?: string;
}

interface ComposeWorkspaceProps {
  initialDocument?: {
    docType: 'post' | 'note' | 'now';
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sectionsToMarkdown(intro: string[], sections: PostSection[]): string {
  const parts: string[] = [];
  if (intro && intro.length > 0) parts.push(intro.join('\n\n'));
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

function markdownToPostSections(md: string): { intro: string[]; sections: PostSection[] } {
  if (!md || !md.trim()) return { intro: [], sections: [] };

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

  // Create initial tab based on passed document
  const createInitialTab = (): DocumentTab => {
    if (initialDocument?.post) {
      const p = initialDocument.post;
      return {
        id: `tab-post-${p.slug}`,
        docType: 'post',
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle || '',
        description: p.description,
        persona: 'builder',
        status: p.status || 'published',
        tags: p.tags || ['essay'],
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
        docType: 'note',
        slug: n.slug,
        title: n.title,
        subtitle: '',
        description: n.description,
        persona: n.persona,
        status: n.status || 'published',
        tags: n.tags || ['note'],
        coverImage: n.coverImage,
        content: n.content.join('\n\n'),
        isDirty: false,
        rawNote: n,
      };
    }
    if (initialDocument?.now) {
      const e = initialDocument.now;
      return {
        id: `tab-now-${e.id}`,
        docType: 'now',
        slug: e.id,
        title: e.title,
        subtitle: '',
        description: '',
        status: 'published',
        tags: [],
        content: e.content,
        isDirty: false,
        rawNow: e,
        date: e.date,
      };
    }

    const docType = initialDocument?.docType || 'post';
    if (docType === 'now') {
      return {
        id: `tab-new-now-${Date.now()}`,
        docType: 'now',
        slug: `now-${Date.now()}`,
        title: '',
        subtitle: '',
        description: '',
        status: 'published',
        tags: [],
        content: 'A short note on what you are reading, exploring, and thinking about this month.',
        isDirty: true,
        date: new Date().toISOString().slice(0, 7),
      };
    }

    const isNote = docType === 'note';
    return {
      id: `tab-new-${Date.now()}`,
      docType: isNote ? 'note' : 'post',
      slug: isNote ? 'new-note' : 'new-essay',
      title: isNote ? 'Untitled Note' : 'Untitled Essay',
      subtitle: '',
      description: '',
      persona: isNote ? 'thinker' : 'builder',
      status: 'published',
      tags: isNote ? ['note'] : ['essay'],
      coverImage: undefined,
      content: isNote
        ? 'An atomic note on tools and focus.\n\n> [!TIP]\n> Keep notes concise and focused.'
        : 'An opening reflection on technology, craft, and ideas.\n\n## The First Principle\n\nSoftware should feel like an orderly workshop.\n\n> [!NOTE]\n> Taking the slower path builds more resilient systems.',
      isDirty: false,
    };
  };

  const [tabs, setTabs] = useState<DocumentTab[]>([createInitialTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

  // Active tab pointer
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // UI state
  const [isSplitView, setIsSplitView] = useState(true);
  const [editorWidthPercent, setEditorWidthPercent] = useState(50);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPublishDrawerOpen, setIsPublishDrawerOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [embedModalKind, setEmbedModalKind] = useState<'book' | 'post' | 'note'>('book');
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [draftsSearchQuery, setDraftsSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Update active tab property helper
  const updateActiveTab = useCallback(
    (updates: Partial<DocumentTab>) => {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId ? { ...tab, ...updates, isDirty: true } : tab
        )
      );
    },
    [activeTabId]
  );

  // Keyboard shortcut listener for Ctrl+S / Cmd+S
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDocument('published');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Resizable split view handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidthPercent = ((ev.clientX - rect.left) / rect.width) * 100;
      if (newWidthPercent >= 20 && newWidthPercent <= 80) {
        setEditorWidthPercent(newWidthPercent);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Formatting helpers for text insertion
  function insertFormat(prefix: string, suffix = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = activeTab.content;
    const selected = current.slice(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix || prefix}`;
    const nextContent = current.slice(0, start) + replacement + current.slice(end);

    updateActiveTab({ content: nextContent });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 4)
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
      docType: 'post',
      slug: `untitled-${tabs.length + 1}`,
      title: `Untitled Draft ${tabs.length + 1}`,
      subtitle: '',
      description: '',
      persona: 'builder',
      status: 'published',
      tags: ['essay'],
      content: 'Write something thoughtful here...',
      isDirty: true,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  }

  function handleCloseTab(idToClose: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (tabs.length === 1) {
      showToast('Cannot close the only open tab.');
      return;
    }
    const nextTabs = tabs.filter((t) => t.id !== idToClose);
    setTabs(nextTabs);
    if (activeTabId === idToClose) {
      setActiveTabId(nextTabs[0].id);
    }
  }

  // Open existing post or note from Drafts Modal
  function handleOpenExistingDocument(doc: BlogPost | NoteItem, type: 'post' | 'note') {
    setIsDraftsModalOpen(false);
    const existing = tabs.find((t) => t.slug === doc.slug && t.docType === type);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    if (type === 'post') {
      const p = doc as BlogPost;
      const tab: DocumentTab = {
        id: `tab-post-${p.slug}`,
        docType: 'post',
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle || '',
        description: p.description,
        persona: 'builder',
        status: p.status || 'published',
        tags: p.tags || ['essay'],
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
        docType: 'note',
        slug: n.slug,
        title: n.title,
        subtitle: '',
        description: n.description,
        persona: n.persona,
        status: n.status || 'published',
        tags: n.tags || ['note'],
        coverImage: n.coverImage,
        content: n.content.join('\n\n'),
        isDirty: false,
        rawNote: n,
      };
      setTabs((prev) => [...prev, tab]);
      setActiveTabId(tab.id);
    }
  }

  // Save Document to database
  async function handleSaveDocument(statusToSet: 'published' | 'unpublished' = 'published') {
    if (!activeTab.title.trim()) {
      showToast('Please provide a document title before saving.');
      return;
    }

    const cleanSlug = slugify(activeTab.slug || activeTab.title);

    startTransition(async () => {
      if (activeTab.docType === 'post') {
        const { intro, sections } = markdownToPostSections(activeTab.content);
        const postPayload: BlogPost = {
          title: activeTab.title,
          slug: cleanSlug,
          subtitle: activeTab.subtitle || undefined,
          description:
            activeTab.description || (intro[0] ? intro[0].slice(0, 150) : activeTab.title),
          tags: activeTab.tags.length > 0 ? activeTab.tags : ['essay'],
          plantedAt: new Date().toISOString().split('T')[0],
          lastTendedAt: new Date().toISOString().split('T')[0],
          assumedAudience: 'Curious readers and builders',
          intro: intro.length > 0 ? intro : [activeTab.subtitle || activeTab.description || activeTab.title],
          sections:
            sections.length > 0
              ? sections
              : [
                  {
                    id: 'sec-1',
                    heading: 'Overview',
                    paragraphs: [activeTab.content || ''],
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
            isDirty: false,
          });
          setIsPublishDrawerOpen(false);
          showToast(`Essay "${activeTab.title}" saved successfully!`);
        } else {
          showToast(res.error || 'Failed to save essay');
        }
      } else if (activeTab.docType === 'now') {
        const nowPayload: NowEntry = {
          id: activeTab.rawNow?.id || activeTab.slug || `now-${Date.now()}`,
          title: activeTab.title.trim(),
          date: activeTab.date || new Date().toISOString().slice(0, 7),
          content: activeTab.content.trim(),
        };

        const res = await saveNowEntryAction(nowPayload);
        if (res.success && res.entry) {
          updateActiveTab({
            slug: res.entry.id,
            isDirty: false,
            rawNow: res.entry,
          });
          setIsPublishDrawerOpen(false);
          showToast(`Now entry "${activeTab.title}" saved to the timeline!`);
        } else {
          showToast(res.error || 'Failed to save now entry');
        }
      } else {
        const paragraphs = activeTab.content
          .split('\n\n')
          .map((p) => p.trim())
          .filter(Boolean);

        const notePayload: NoteItem = {
          id: activeTab.rawNote?.id || `note-${Date.now()}`,
          title: activeTab.title,
          slug: cleanSlug,
          description:
            activeTab.description ||
            (paragraphs[0] ? paragraphs[0].slice(0, 120) : activeTab.title),
          content: paragraphs.length > 0 ? paragraphs : [activeTab.title],
          date: new Date().toISOString().split('T')[0],
          persona: activeTab.persona,
          tags: activeTab.tags.length > 0 ? activeTab.tags : ['note'],
          coverImage: activeTab.coverImage,
          status: statusToSet,
        };

        const res = await saveNoteAction(notePayload);
        if (res.success && res.note) {
          updateActiveTab({
            slug: cleanSlug,
            status: statusToSet,
            isDirty: false,
          });
          setIsPublishDrawerOpen(false);
          showToast(`Note "${activeTab.title}" saved successfully!`);
        } else {
          showToast(res.error || 'Failed to save note');
        }
      }
    });
  }

  // Word count & reading time metrics
  const wordCount = activeTab.content.trim()
    ? activeTab.content.trim().split(/\s+/).length
    : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Combine items for Drafts modal search
  const allDraftItems = [
    ...allPosts.map((p) => ({ ...p, itemKind: 'post' as const })),
    ...allNotes.map((n) => ({ ...n, itemKind: 'note' as const })),
  ].filter((item) => {
    const q = draftsSearchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc] font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 right-10 z-50 rounded-xl bg-[#252526] border border-[#444] px-4 py-2.5 text-xs font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* 1. VS Code Multi-Tab Bar with + button and Folder Icon */}
      <div className="flex h-[35px] shrink-0 bg-[#111111] border-b border-[#222] overflow-x-auto relative select-none">
        {/* Navigation back to Admin */}
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-3.5 h-full text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#222] border-r border-[#222] transition-colors shrink-0"
          title="Back to Admin Dashboard"
        >
          <span>←</span>
          <span>Admin</span>
        </Link>

        {/* Tab List */}
        {tabs.map((tab) => {
          const isSelected = tab.id === activeTabId;
          const displayTabName = `${slugify(tab.slug || tab.title || 'untitled')}.mdx`;

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center h-full px-3.5 cursor-pointer min-w-[150px] max-w-[240px] group transition-colors border-r border-[#1a1a1a] text-xs ${
                isSelected
                  ? 'bg-[#1e1e1e] text-white font-medium'
                  : 'bg-[#252525] text-neutral-400 hover:bg-[#2a2a2a] hover:text-neutral-200'
              }`}
            >
              <span className={`mr-2 shrink-0 text-xs ${isSelected ? 'text-[#ff7700]' : 'text-neutral-500'}`}>
                {tab.docType === 'post' ? '📄' : tab.docType === 'note' ? '📝' : '⏰'}
              </span>
              <span className="truncate flex-1 font-mono text-[11px]">{displayTabName}</span>

              {isPending && isSelected ? (
                <span className="h-2 w-2 rounded-full border border-blue-400 border-t-transparent animate-spin ml-1.5 shrink-0" />
              ) : tab.isDirty ? (
                <span className="text-amber-400 font-mono text-xs ml-1.5 shrink-0" title="Unsaved changes">
                  ●
                </span>
              ) : null}

              <button
                type="button"
                onClick={(e) => handleCloseTab(tab.id, e)}
                className="ml-2 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-[#383838] hover:text-white transition-opacity shrink-0"
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
          className="flex h-full items-center px-3 text-neutral-400 hover:bg-[#222] hover:text-white transition-colors"
          title="New Draft (+)"
        >
          <span className="text-base font-normal">+</span>
        </button>

        {/* Folder Icon: Open Drafts Modal */}
        <button
          type="button"
          onClick={() => setIsDraftsModalOpen(true)}
          className="flex h-full items-center px-3 text-neutral-400 hover:bg-[#222] hover:text-white transition-colors text-xs"
          title="Open Existing Draft or Note (📁)"
        >
          <span>📁</span>
        </button>

        <div className="flex-1 bg-[#111111]" />
      </div>

      {/* 2. Unified Toolbar matching Develop Branch with Split Preview, Save, Publish */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#222] bg-[#181818] px-4 overflow-x-auto select-none">
        {/* Left Formatting Group */}
        <div className="flex items-center gap-4">
          {/* Bold & Italic */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => insertFormat('**')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors"
              title="Bold (Cmd+B)"
            >
              <b>B</b>
            </button>
            <button
              type="button"
              onClick={() => insertFormat('*')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors"
              title="Italic (Cmd+I)"
            >
              <i>I</i>
            </button>
          </div>

          <div className="h-4 w-px bg-[#333]" />

          {/* Link & Code */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => insertFormat('[', '](https://)')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors"
              title="Link (Cmd+K)"
            >
              🔗
            </button>
            <button
              type="button"
              onClick={() => insertFormat('`')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors font-mono"
              title="Inline Code"
            >
              &lt;/&gt;
            </button>
          </div>

          <div className="h-4 w-px bg-[#333]" />

          {/* Structure: Headings, Quotes, Tables, Callouts */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => insertBlock('## Section Heading')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors font-semibold"
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertBlock('### Subsection')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors font-semibold"
              title="Heading 3"
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => insertBlock('> "A quote exploring quiet attention."\n> — Author')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors"
              title="Blockquote"
            >
              “
            </button>
            <button
              type="button"
              onClick={() => insertBlock('```typescript\n// Code block here\n```')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors font-mono"
              title="Code Block"
            >
              Pre
            </button>
            <button
              type="button"
              onClick={() => insertBlock('| Column 1 | Column 2 |\n| :--- | :--- |\n| Value A | Value B |')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors"
              title="Table"
            >
              ▦
            </button>
            <button
              type="button"
              onClick={() => insertBlock('> [!NOTE]\n> Key context note here.')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors"
              title="Callout Box"
            >
              💡
            </button>
          </div>

          <div className="h-4 w-px bg-[#333]" />

          {/* Embeds: Images, Media, Video */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => insertBlock('![Image Alt](https://)\n*Caption text*')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors"
              title="Insert Image URL"
            >
              🖼
            </button>
            <button
              type="button"
              onClick={() => setIsMediaModalOpen(true)}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-[#ff7700] transition-colors"
              title="Media Library Asset"
            >
              📁 Media
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors"
              title="Upload Local Image"
            >
              ☁ Upload
            </button>
            <button
              type="button"
              onClick={() => insertBlock('<YouTube id="dQw4w9WgXcQ" />')}
              className="rounded p-1.5 text-xs text-neutral-300 hover:bg-[#282828] hover:text-white transition-colors"
              title="Embed YouTube Video"
            >
              ▶ Video
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
              const url = URL.createObjectURL(file);
              insertBlock(`![${file.name}](${url})\n*${file.name}*`);
            }
          }}
        />

        {/* Right Placement: Split Preview, Preview, Save Draft, Publish Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Split Preview Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSplitView(!isSplitView)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border ${
              isSplitView
                ? 'border-[#333] bg-[#222] text-[#ff7700]'
                : 'border-transparent text-neutral-400 hover:bg-[#222] hover:text-white'
            }`}
            title="Toggle Split Preview"
          >
            <span>◫</span>
            <span>Split Preview</span>
          </button>

          {/* Save Draft Button with Pulse / Check status */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSaveDocument('unpublished')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors border ${
              activeTab.isDirty
                ? 'border-amber-500/40 bg-[#252526] hover:bg-[#333] text-amber-300'
                : 'border-[#333] bg-[#1e1e1e] hover:bg-[#2a2a2a] text-neutral-300'
            } disabled:opacity-50`}
            title="Save Draft (Ctrl+S / Cmd+S)"
          >
            {isPending ? (
              <>
                <span className="h-2 w-2 rounded-full border border-blue-400 border-t-transparent animate-spin" />
                <span>Saving...</span>
              </>
            ) : activeTab.isDirty ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Save Draft</span>
              </>
            ) : (
              <>
                <span className="text-emerald-400">✓</span>
                <span>Saved</span>
              </>
            )}
          </button>

          {/* Publish Live Button */}
          <button
            type="button"
            onClick={() =>
              activeTab.docType === 'now'
                ? handleSaveDocument('published')
                : setIsPublishDrawerOpen(true)
            }
            className="flex items-center gap-1.5 rounded-md bg-[#ff7700] hover:bg-[#e66a00] text-black px-3.5 py-1 text-xs font-bold transition-all shadow-sm"
          >
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex flex-1 min-h-0 relative">
        <div className="flex-1 min-w-0 flex flex-col relative h-full">
          {/* Breadcrumbs Row: Persona + Title */}
          <div className="flex items-center min-h-[34px] bg-[#1e1e1e] px-4 text-[#cccccc] shrink-0 text-xs font-sans border-b border-[#242424] z-10">
            {activeTab.docType !== 'now' && (
              <>
                <select
                  value={activeTab.persona}
                  onChange={(e) => updateActiveTab({ persona: e.target.value as Persona })}
                  className="bg-transparent text-neutral-400 hover:text-white capitalize font-mono text-[11px] focus:outline-none cursor-pointer"
                >
                  <option value="builder" className="bg-[#1e1e1e] text-white">builder</option>
                  <option value="operator" className="bg-[#1e1e1e] text-white">operator</option>
                  <option value="thinker" className="bg-[#1e1e1e] text-white">thinker</option>
                  <option value="wanderer" className="bg-[#1e1e1e] text-white">wanderer</option>
                </select>
                <span className="mx-2 opacity-40">›</span>
              </>
            )}
            <input
              type="text"
              value={activeTab.title}
              onChange={(e) => {
                const title = e.target.value;
                updateActiveTab({
                  title,
                  slug: activeTab.isDirty ? activeTab.slug : slugify(title),
                });
              }}
              placeholder={activeTab.docType === 'now' ? 'Now Entry Title...' : 'Post Title...'}
              className="flex-1 bg-transparent border-none outline-none text-white font-medium placeholder-[#555] py-1 text-xs"
            />
          </div>

          {/* Subtitle Row */}
          <div className="flex items-center min-h-[30px] bg-[#1a1a1a] px-4 text-[#cccccc] shrink-0 border-b border-[#222] justify-between">
            {activeTab.docType === 'now' ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 shrink-0">
                  Date
                </span>
                <input
                  type="month"
                  value={activeTab.date || ''}
                  onChange={(e) => updateActiveTab({ date: e.target.value })}
                  className="bg-transparent border-none outline-none text-[#a0a0a0] placeholder-[#555] py-1 text-xs font-mono"
                />
              </div>
            ) : (
              <input
                type="text"
                value={activeTab.subtitle}
                onChange={(e) => updateActiveTab({ subtitle: e.target.value })}
                placeholder="Subtitle (optional)..."
                className="flex-1 bg-transparent border-none outline-none text-[#a0a0a0] placeholder-[#555] py-1 text-xs italic"
              />
            )}
            {activeTab.docType !== 'now' && (
              <button
                type="button"
                onClick={() => setIsPublishDrawerOpen(true)}
                className="text-sm text-amber-300 hover:text-amber-200 transition-colors ml-3 shrink-0 p-1 hover:bg-[#252525] rounded"
                title="AI Summary"
              >
                ✨
              </button>
            )}
          </div>

          {/* Editor & Live Split View */}
          <div className="flex-1 flex flex-row relative min-h-0" ref={containerRef}>
            {/* Left Editor Area */}
            <div
              className="relative h-full min-w-0 bg-[#1e1e1e]"
              style={{ width: isSplitView ? `${editorWidthPercent}%` : '100%' }}
            >
              <textarea
                ref={textareaRef}
                value={activeTab.content}
                onChange={(e) => updateActiveTab({ content: e.target.value })}
                placeholder="Write your article in Markdown / MDX..."
                className="w-full h-full resize-none bg-[#1e1e1e] p-6 font-mono text-xs leading-relaxed text-[#d4d4d4] focus:outline-none selection:bg-[#264f78]"
                spellCheck={false}
              />
            </div>

            {/* Split Resizer Handle */}
            {isSplitView && (
              <div
                className="w-1.5 bg-[#181818] border-x border-[#222] hover:bg-[#ff7700] cursor-col-resize transition-colors z-10 shrink-0 relative"
                onMouseDown={handleMouseDown}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none opacity-40">
                  <div className="w-0.5 h-1 bg-[#888] rounded-full" />
                  <div className="w-0.5 h-1 bg-[#888] rounded-full" />
                  <div className="w-0.5 h-1 bg-[#888] rounded-full" />
                </div>
              </div>
            )}

            {/* Right Live Preview Area */}
            {isSplitView && (
              <div
                className="relative h-full overflow-hidden bg-paper"
                style={{ width: `calc(${100 - editorWidthPercent}% - 6px)` }}
              >
                <MDXPreview
                  content={activeTab.content}
                  title={activeTab.title}
                  subtitle={activeTab.subtitle}
                  persona={activeTab.persona}
                  tags={activeTab.tags}
                  books={activeTab.rawPost?.books}
                  assumedAudience={activeTab.rawPost?.assumedAudience}
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
      <div className="flex h-[26px] items-center justify-between border-t border-[#222] bg-[#111111] px-4 text-[11px] text-neutral-400 select-none">
        <div className="flex items-center gap-4 font-mono">
          <span className="capitalize text-neutral-300">
            {activeTab.docType === 'now'
              ? 'now • timeline entry'
              : `${activeTab.persona} • ${activeTab.docType}`}
          </span>
          <span className="text-neutral-500">|</span>
          <span className={activeTab.isDirty ? 'text-amber-400' : 'text-emerald-400'}>
            {activeTab.isDirty ? '● Unsaved' : '✓ Synced'}
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
        persona={activeTab.persona}
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
        date={activeTab.date}
        onDateChange={(date) => updateActiveTab({ date })}
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

      {/* 5. Open Existing Drafts / Notes Modal (Triggered by Folder Icon) */}
      {isDraftsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-[#333] bg-[#1a1a1a] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden text-neutral-200">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] bg-[#141414]">
              <div className="flex items-center gap-2">
                <span className="text-base">📁</span>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Open Existing Draft or Note
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-[#262626]">
              <input
                type="text"
                placeholder="Search essays or notes by title..."
                value={draftsSearchQuery}
                onChange={(e) => setDraftsSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#333] bg-[#111] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#ff7700] focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {allDraftItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 italic">
                  No matching drafts or notes found.
                </div>
              ) : (
                allDraftItems.map((item) => (
                  <button
                    key={`${item.itemKind}-${item.slug}`}
                    type="button"
                    onClick={() => handleOpenExistingDocument(item, item.itemKind)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-[#141414] hover:bg-[#222] border border-transparent hover:border-[#3a3a3a] text-left transition-all group"
                  >
                    <div className="flex flex-col min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{item.itemKind === 'post' ? '📄' : '📝'}</span>
                        <span className="text-xs font-semibold text-neutral-200 group-hover:text-[#ff7700] truncate">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {item.description || 'No description'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 uppercase shrink-0">
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
