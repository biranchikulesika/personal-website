'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { BlogPost, BookCard, BookItem, MediaItem, NoteItem, Persona } from '@/lib/types';
import { MDXPreview } from './mdx-preview';
import { MediaInsertModal } from './media-insert-modal';
import { EmbedInsertModal } from './embed-insert-modal';
import { MDX_BLOCK_LIBRARY, findBlock } from '@/components/blocks/library';

interface MDXEditorProps {
  initialContent: string;
  title?: string;
  subtitle?: string;
  persona?: Persona;
  date?: string;
  tags?: string[];
  targetAudience?: string;
  books?: BookCard[];
  mediaItems?: MediaItem[];
  embedBooks?: BookItem[];
  embedPosts?: BlogPost[];
  embedNotes?: NoteItem[];
  onChange: (newContent: string) => void;
  className?: string;
}

type ViewMode = 'split' | 'editor' | 'preview';

/**
 * Internal hook that debounces a string value. Returns the debounced value
 * that updates `delay` ms after the last change to `value`. The initial
 * value is used as-is (no delay on first render).
 */
function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export function MDXEditor({
  initialContent,
  title,
  subtitle,
  persona,
  date,
  tags,
  targetAudience,
  books,
  mediaItems = [],
  embedBooks = [],
  embedPosts = [],
  embedNotes = [],
  onChange,
  className = '',
}: MDXEditorProps) {
  // --- Fix 4: Removed the useEffect(() => setContent(initialContent), [initialContent]).
  // The initial content is set via useState(initialContent). When the parent
  // opens a different document, it will remount this component (the key or the
  // conditional rendering changes), so a fresh mount picks up the new
  // initialContent automatically. If the parent ever updates initialContent
  // while the component stays mounted (e.g. switching tabs), we handle it
  // below with a ref-based guard that only syncs on genuine external changes.
  const [content, setContent] = useState(initialContent);
  const contentRef = useRef(content);
  const onChangeRef = useRef(onChange);

  // Keep refs current so the effect below doesn't re-run on every keystroke.
  contentRef.current = content;
  onChangeRef.current = onChange;

  // Sync external content changes (e.g. switching between documents).
  // This only fires when initialContent changes to a *different* value than
  // what the editor currently holds, avoiding the redundant double-set loop.
  useEffect(() => {
    if (initialContent !== contentRef.current) {
      setContent(initialContent);
    }
    // Only react when the parent provides a new document; ignore the
    // onChange-driven loop because contentRef tracks internal state.
  }, [initialContent]);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [embedModalKind, setEmbedModalKind] = useState<'book' | 'post' | 'note'>('book');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = useCallback(
    (newVal: string) => {
      setContent(newVal);
      onChange(newVal);
    },
    [onChange]
  );

  // --- Fix 1: Debounced preview content ---
  // The preview only receives content after the user pauses typing for ~250ms.
  // During active typing the textarea stays fully responsive because `content`
  // (the real editor state) updates instantly.
  const previewContent = useDebouncedValue(content, 250);

  // --- Fix 2: Debounced stats ---
  // Stats are also derived from the debounced value so the expensive O(n)
  // string splits in calculateStats only run when typing pauses.
  const stats = calculateStats(previewContent);

  // Keyboard shortcut handler
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // 1. Tab key indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      const updated = value.substring(0, start) + '  ' + value.substring(end);
      handleContentChange(updated);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
      return;
    }

    // 2. Cmd/Ctrl + B -> Bold
    if (isCmdOrCtrl && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      wrapSelection('**', '**');
      return;
    }

    // 3. Cmd/Ctrl + I -> Italic
    if (isCmdOrCtrl && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      wrapSelection('*', '*');
      return;
    }

    // 4. Cmd/Ctrl + K -> Link
    if (isCmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      wrapSelection('[', '](https://)');
      return;
    }
  }

  // Insert wrapper at cursor selection
  function wrapSelection(before: string, after: string, defaultText = 'text') {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selectedText = val.substring(start, end) || defaultText;

    const updated = val.substring(0, start) + before + selectedText + after + val.substring(end);
    handleContentChange(updated);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    });
  }

  // Insert prefix on current line
  function insertLinePrefix(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const val = textarea.value;
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;

    const updated = val.substring(0, lineStart) + prefix + val.substring(lineStart);
    handleContentChange(updated);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
    });
  }

  // Insert full template block
  function insertBlock(template: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    const prefix = val.length > 0 && !val.substring(0, start).endsWith('\n\n') ? '\n\n' : '';
    const suffix = '\n\n';

    const updated = val.substring(0, start) + prefix + template + suffix + val.substring(end);
    handleContentChange(updated);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + prefix.length + template.length;
    });
  }

  return (
    <div
      className={`flex flex-col rounded-3xl border border-tinted/20 bg-night text-paper shadow-md overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[650px]'
      } ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tinted/20 bg-night-soft px-4 py-2.5">
        {/* Left Formatting Tools */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <button
            type="button"
            onClick={() => insertLinePrefix('# ')}
            className="rounded-lg px-2 py-1 text-xs font-bold text-paper hover:bg-post-card hover:border hover:border-tinted/30"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('## ')}
            className="rounded-lg px-2 py-1 text-xs font-bold text-paper hover:bg-post-card hover:border hover:border-tinted/30"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('### ')}
            className="rounded-lg px-2 py-1 text-xs font-bold text-paper hover:bg-post-card hover:border hover:border-tinted/30"
            title="Heading 3"
          >
            H3
          </button>

          <span className="mx-1 h-4 w-px bg-tinted/30" />

          {/* Styles */}
          <button
            type="button"
            onClick={() => wrapSelection('**', '**', 'bold text')}
            className="rounded-lg px-2 py-1 text-xs font-bold text-paper hover:bg-post-card hover:border hover:border-tinted/30"
            title="Bold (Cmd+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('*', '*', 'italic text')}
            className="rounded-lg px-2 py-1 text-xs font-serif italic text-paper hover:bg-post-card hover:border hover:border-tinted/30"
            title="Italic (Cmd+I)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('`', '`', 'code')}
            className="rounded-lg px-2 py-1 font-mono text-xs text-paper hover:bg-post-card hover:border hover:border-tinted/30"
            title="Inline Code"
          >
            {'</>'}
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('~~', '~~', 'struck text')}
            className="rounded-lg px-2 py-1 text-xs line-through text-gray-mid hover:bg-post-card hover:border hover:border-tinted/30"
            title="Strikethrough"
          >
            S
          </button>

          <span className="mx-1 h-4 w-px bg-tinted/30" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onClick={() => insertLinePrefix('- ')}
            className="rounded-lg px-2 py-1 text-xs text-paper hover:bg-post-card hover:border hover:border-tinted/30"
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('1. ')}
            className="rounded-lg px-2 py-1 text-xs text-paper hover:bg-post-card hover:border hover:border-tinted/30"
            title="Numbered List"
          >
            1. List
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('> ')}
            className="rounded-lg px-2 py-1 text-xs font-serif italic text-paper hover:bg-post-card hover:border hover:border-tinted/30"
            title="Blockquote"
          >
            Quote
          </button>
          <button
            type="button"
            onClick={() => insertBlock('```typescript\n// code snippet\n```')}
            className="rounded-lg px-2 py-1 text-xs text-paper hover:bg-post-card hover:border hover:border-tinted/30"
            title="Code Block"
          >
            CodeBlock
          </button>

          <span className="mx-1 h-4 w-px bg-tinted/30" />

          {/* Quick Insert Snippets */}
          <button
            type="button"
            onClick={() => insertBlock('> [!NOTE]\n> Key takeaway or background context.')}
            className="rounded-lg bg-sea-blue/20 px-2 py-1 text-xs font-semibold text-sea-blue border border-sea-blue/30 hover:bg-sea-blue/30"
            title="Insert Callout Alert"
          >
            + Callout
          </button>
          <button
            type="button"
            onClick={() =>
              insertBlock(
                '| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Value 1 | Value 2 | Value 3 |\n| Value 4 | Value 5 | Value 6 |'
              )
            }
            className="rounded-lg bg-night px-2 py-1 text-xs font-medium text-paper border border-tinted/20 hover:bg-post-card"
            title="Insert Markdown Table"
          >
            + Table
          </button>
          <button
            type="button"
            onClick={() => {
              const block = findBlock('Book');
              if (block) insertBlock(block.snippet);
            }}
            className="rounded-lg bg-post-card px-2.5 py-1 text-xs font-semibold text-accent border border-tinted/20 hover:bg-accent hover:text-paper transition-colors"
            title="Insert Book Block"
          >
            📖 Book
          </button>
          <button
            type="button"
            onClick={() => setIsMediaModalOpen(true)}
            className="rounded-lg bg-post-card px-2.5 py-1 text-xs font-semibold text-accent border border-tinted/20 hover:bg-accent hover:text-paper transition-colors"
            title="Insert from Resources"
          >
            🖼 Media
          </button>
          <button
            type="button"
            onClick={() => setIsEmbedModalOpen(true)}
            className="rounded-lg bg-post-card px-2.5 py-1 text-xs font-semibold text-accent border border-tinted/20 hover:bg-accent hover:text-paper transition-colors"
            title="Embed a book, essay, or note"
          >
            🔗 Embed
          </button>
        </div>

        {/* Right View Modes & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-full bg-night p-0.5 border border-tinted/20">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === 'editor'
                  ? 'bg-accent text-paper shadow-2xs'
                  : 'text-gray-mid hover:text-paper'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-accent text-paper shadow-2xs'
                  : 'text-gray-mid hover:text-paper'
              }`}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === 'preview'
                  ? 'bg-accent text-paper shadow-2xs'
                  : 'text-gray-mid hover:text-paper'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="rounded-full bg-night-soft p-1.5 text-xs text-gray-mid border border-tinted/20 hover:bg-post-card hover:text-paper"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0h4m-4 0v4m6 6l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0h4m-4 0v-4m6-6l5-5m0 0v4m0-4h-4" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Work Area (Split / Single) */}
      <div className="flex flex-1 min-h-0 divide-x divide-tinted/20">
        {/* Editor Pane */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`relative h-full flex-1 min-w-0 bg-night ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your thoughts, essays, notes, or marginalia in Markdown / MDX..."
              className="h-full w-full resize-none bg-transparent p-5 sm:p-6 font-mono text-sm leading-relaxed text-paper placeholder:text-gray-mid/40 focus:outline-none overflow-y-auto"
              spellCheck="false"
            />
          </div>
        )}

        {/* Live Preview Pane — receives debounced content */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`h-full flex-1 min-w-0 bg-night ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <MDXPreview
              content={previewContent}
              title={title}
              subtitle={subtitle}
              persona={persona}
              date={date}
              tags={tags}
              targetAudience={targetAudience}
              books={books}
            />
          </div>
        )}
      </div>

      {/* 3. Footer Stats Bar — driven by debounced content */}
      <div className="flex flex-wrap items-center justify-between border-t border-tinted/20 bg-night-soft px-4 py-2 text-[11px] text-gray-mid">
        <div className="flex items-center gap-4">
          <span><b className="text-paper">{stats.words}</b> words</span>
          <span>•</span>
          <span><b className="text-paper">{stats.chars}</b> chars</span>
          <span>•</span>
          <span><b className="text-paper">{stats.lines}</b> lines</span>
          <span>•</span>
          <span className="text-accent font-medium">~{stats.readTime} min read</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[10px]">
          <span><kbd className="rounded bg-night px-1 py-0.5 border border-tinted/20 font-mono text-paper">Tab</kbd> Indent</span>
          <span><kbd className="rounded bg-night px-1 py-0.5 border border-tinted/20 font-mono text-paper">Cmd+B</kbd> Bold</span>
          <span><kbd className="rounded bg-night px-1 py-0.5 border border-tinted/20 font-mono text-paper">Cmd+I</kbd> Italic</span>
          <span><kbd className="rounded bg-night px-1 py-0.5 border border-tinted/20 font-mono text-paper">Cmd+K</kbd> Link</span>
        </div>
      </div>

      {/* Media Insert Modal */}
      <MediaInsertModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        mediaItems={mediaItems}
        onSelect={(imgMd) => insertBlock(imgMd)}
      />

      {/* Embed Content Modal */}
      <EmbedInsertModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        books={embedBooks}
        posts={embedPosts}
        notes={embedNotes}
        initialType={embedModalKind}
        onSelect={(snippet) => insertBlock(snippet)}
      />
    </div>
  );
}

function calculateStats(text: string) {
  if (!text || !text.trim()) {
    return { words: 0, chars: 0, lines: 1, readTime: 0 };
  }

  const chars = text.length;
  const lines = text.split('\n').length;
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  return { words, chars, lines, readTime };
}
