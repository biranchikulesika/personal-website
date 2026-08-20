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
  assumedAudience?: string;
  books?: BookCard[];
  mediaItems?: MediaItem[];
  embedBooks?: BookItem[];
  embedPosts?: BlogPost[];
  embedNotes?: NoteItem[];
  onChange: (newContent: string) => void;
  className?: string;
}

type ViewMode = 'split' | 'editor' | 'preview';

export function MDXEditor({
  initialContent,
  title,
  subtitle,
  persona,
  date,
  tags,
  assumedAudience,
  books,
  mediaItems = [],
  embedBooks = [],
  embedPosts = [],
  embedNotes = [],
  onChange,
  className = '',
}: MDXEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [embedModalKind, setEmbedModalKind] = useState<'book' | 'post' | 'note'>('book');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleContentChange = useCallback(
    (newVal: string) => {
      setContent(newVal);
      onChange(newVal);
    },
    [onChange]
  );

  // Stats calculation
  const stats = calculateStats(content);

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
      className={`flex flex-col rounded-3xl border border-tinted bg-paper shadow-md overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[650px]'
      } ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tinted bg-cream px-4 py-2.5">
        {/* Left Formatting Tools */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <button
            type="button"
            onClick={() => insertLinePrefix('# ')}
            className="rounded-lg px-2 py-1 text-xs font-bold text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('## ')}
            className="rounded-lg px-2 py-1 text-xs font-bold text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('### ')}
            className="rounded-lg px-2 py-1 text-xs font-bold text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Heading 3"
          >
            H3
          </button>

          <span className="mx-1 h-4 w-px bg-tinted" />

          {/* Styles */}
          <button
            type="button"
            onClick={() => wrapSelection('**', '**', 'bold text')}
            className="rounded-lg px-2 py-1 text-xs font-bold text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Bold (Cmd+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('*', '*', 'italic text')}
            className="rounded-lg px-2 py-1 text-xs font-serif italic text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Italic (Cmd+I)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('`', '`', 'code')}
            className="rounded-lg px-2 py-1 font-mono text-xs text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Inline Code"
          >
            {'</>'}
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('~~', '~~', 'struck text')}
            className="rounded-lg px-2 py-1 text-xs line-through text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Strikethrough"
          >
            S
          </button>

          <span className="mx-1 h-4 w-px bg-tinted" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onClick={() => insertLinePrefix('- ')}
            className="rounded-lg px-2 py-1 text-xs text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('1. ')}
            className="rounded-lg px-2 py-1 text-xs text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Numbered List"
          >
            1. List
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('> ')}
            className="rounded-lg px-2 py-1 font-serif text-xs italic text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Blockquote"
          >
            Quote
          </button>
          <button
            type="button"
            onClick={() => insertBlock('```typescript\n// code snippet\n```')}
            className="rounded-lg px-2 py-1 text-xs text-ink hover:bg-paper hover:ring-1 hover:ring-tinted"
            title="Code Block"
          >
            CodeBlock
          </button>

          <span className="mx-1 h-4 w-px bg-tinted" />

          {/* Quick Insert Snippets */}
          <button
            type="button"
            onClick={() => insertBlock('> [!NOTE]\n> Key takeaway or background context.')}
            className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-900 ring-1 ring-blue-200 hover:bg-blue-100"
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
            className="rounded-lg bg-paper px-2 py-1 text-xs font-medium text-ink ring-1 ring-tinted hover:bg-cream"
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
            className="rounded-lg bg-paper px-2.5 py-1 text-xs font-semibold text-accent ring-1 ring-tinted hover:bg-ink hover:text-cream transition-colors"
            title="Insert Book Block"
          >
            📖 Book
          </button>
          <button
            type="button"
            onClick={() => setIsMediaModalOpen(true)}
            className="rounded-lg bg-paper px-2.5 py-1 text-xs font-semibold text-accent ring-1 ring-tinted hover:bg-ink hover:text-cream transition-colors"
            title="Insert from Media Resources"
          >
            🖼 Media
          </button>
          <button
            type="button"
            onClick={() => setIsEmbedModalOpen(true)}
            className="rounded-lg bg-paper px-2.5 py-1 text-xs font-semibold text-accent ring-1 ring-tinted hover:bg-ink hover:text-cream transition-colors"
            title="Embed a book, essay, or note"
          >
            🔗 Embed
          </button>
        </div>

        {/* Right View Modes & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-full bg-paper p-0.5 ring-1 ring-tinted">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === 'editor'
                  ? 'bg-ink text-cream shadow-2xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-ink text-cream shadow-2xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === 'preview'
                  ? 'bg-ink text-cream shadow-2xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="rounded-full bg-paper p-1.5 text-xs text-ink-soft ring-1 ring-tinted hover:bg-cream hover:text-ink"
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
      <div className="flex flex-1 min-h-0 divide-x divide-tinted">
        {/* Editor Pane */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`relative h-full flex-1 min-w-0 bg-paper ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your thoughts, essays, notes, or marginalia in Markdown / MDX..."
              className="h-full w-full resize-none bg-transparent p-5 sm:p-6 font-mono text-sm leading-relaxed text-ink placeholder:text-ink-soft/50 focus:outline-none overflow-y-auto"
              spellCheck="false"
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`h-full flex-1 min-w-0 bg-paper ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <MDXPreview
              content={content}
              title={title}
              subtitle={subtitle}
              persona={persona}
              date={date}
              tags={tags}
              assumedAudience={assumedAudience}
              books={books}
            />
          </div>
        )}
      </div>

      {/* 3. Footer Stats Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-tinted bg-cream/70 px-4 py-2 text-[11px] text-ink-soft">
        <div className="flex items-center gap-4">
          <span><b>{stats.words}</b> words</span>
          <span>•</span>
          <span><b>{stats.chars}</b> chars</span>
          <span>•</span>
          <span><b>{stats.lines}</b> lines</span>
          <span>•</span>
          <span className="text-ink font-medium">~{stats.readTime} min read</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[10px]">
          <span><kbd className="rounded bg-paper px-1 py-0.5 ring-1 ring-tinted font-mono">Tab</kbd> Indent</span>
          <span><kbd className="rounded bg-paper px-1 py-0.5 ring-1 ring-tinted font-mono">Cmd+B</kbd> Bold</span>
          <span><kbd className="rounded bg-paper px-1 py-0.5 ring-1 ring-tinted font-mono">Cmd+I</kbd> Italic</span>
          <span><kbd className="rounded bg-paper px-1 py-0.5 ring-1 ring-tinted font-mono">Cmd+K</kbd> Link</span>
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
