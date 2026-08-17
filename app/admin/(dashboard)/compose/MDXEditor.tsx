'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, Code, LayoutTemplate, Quote, TableProperties, Video, X, UploadCloud, FileImage, Search, ChevronRight, ChevronLeft, Columns, Plus, FolderOpen, Type } from 'lucide-react';

import MediaLibraryModal from './MediaLibraryModal';
import MDXPreview from './MDXPreview';
import { useImageUpload } from '@/hooks/useImageUpload';
import ImageUploadOverlay from '@/components/admin/image-upload-overlay';
import UploadProgress from '@/components/admin/upload-progress';
import { COMPONENT_GROUPS } from '@/components/admin/editor/component-library';
import type { ComponentEntry } from '@/components/admin/editor/component-library';

export type EditorTab = {
  id: string;
  title: string;
  isDirty?: boolean;
  saveStatus?: string;
};

interface MDXEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  persona?: string;
  onPersonaChange?: (persona: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  subtitle: string;
  onSubtitleChange: (subtitle: string) => void;
  actionButtons?: React.ReactNode;

  tabs?: EditorTab[];
  activeTabId?: string;
  onTabSelect?: (id: string) => void;
  onTabClose?: (id: string) => void;
  onNewTab?: () => void;
  onOpenDrafts?: () => void;
}

const ToolbarButton = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="p-1.5 hover:bg-[#333] rounded-md text-neutral-400 hover:text-neutral-100 transition-colors flex items-center justify-center"
    title={label}
  >
    <Icon className="w-4 h-4" />
  </button>
);

// ── Monaco Editor Core ────────────────────────────────────────────────
// Uses monaco.editor.create() directly instead of @monaco-editor/react's
// Editor component. This gives us full control over the editor lifecycle
// and eliminates wrapper bugs that could cause cursor/view desync.

// Dynamic import to avoid SSR issues
let monacoModule: any = null;
async function getMonaco() {
  if (!monacoModule) {
    monacoModule = await import('monaco-editor');
    // Configure the global Monaco environment to use the local npm package's
    // workers via blob URLs, eliminating CDN dependency entirely.
    const monaco = monacoModule;
    monaco.editor.MonacoEnvironment = {
      getWorker(_workerId: string, _label: string) {
        return new Worker(
          new URL(
            'monaco-editor/esm/vs/editor/editor.worker.js',
            import.meta.url
          ),
          { type: 'module' }
        );
      },
    };
  }
  return monacoModule;
}

/**
 * Monaco options — defined once as a constant to ensure referential stability.
 * Creating a new object on every render would cause @monaco-editor/react to
 * call editor.updateOptions() unnecessarily, potentially resetting view state.
 */
const MONACO_OPTIONS: Record<string, any> = {
  minimap: { enabled: false },
  wordWrap: 'on',
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  padding: { top: 24, bottom: 48 },
  fontSize: 14,
  bracketPairColorization: { enabled: true },
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  formatOnPaste: true,
  cursorStyle: 'line',
  cursorWidth: 2,
  cursorBlinking: 'smooth',
  selectionHighlight: true,
  renderLineHighlight: 'all',
  automaticLayout: true,  // Keeps editor in sync with container size
};

export default function MDXEditor({
  content,
  onChange,
  className = '',
  persona = 'builder',
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  actionButtons,
  tabs = [],
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  onOpenDrafts
}: MDXEditorProps) {
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSplitView, setIsSplitView] = useState(false);
  const [editorWidthPercent, setEditorWidthPercent] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [monacoReady, setMonacoReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const monacoInstanceRef = useRef<any>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // ── Formatting Helpers ────────────────────────────────────────────────

  const applyFormat = useCallback((wrapper: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = editor.getSelection();
    const model = editor.getModel();
    if (!model || !sel) return;
    const text = model.getValueInRange(sel);
    const unwrapped = text.startsWith(wrapper) && text.endsWith(wrapper);
    editor.executeEdits('format', [
      { range: sel, text: unwrapped ? text.slice(wrapper.length, -wrapper.length) : `${wrapper}${text}${wrapper}`, forceMoveMarkers: true }
    ]);
    editor.focus();
  }, []);

  const applyLink = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = editor.getSelection();
    const model = editor.getModel();
    if (!model || !sel) return;
    const text = model.getValueInRange(sel);
    const url = window.prompt('URL:');
    if (url === null) return;
    editor.executeEdits('link', [{ range: sel, text: text ? `[${text}](${url})` : `[Link text](${url})`, forceMoveMarkers: true }]);
    editor.focus();
  }, []);

  const insertComponent = useCallback((tag: string, props: Record<string, string> = {}) => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = editor.getSelection();
    const propsStr = Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ');
    editor.executeEdits('component', [{ range: sel, text: `<${tag}${propsStr ? ' ' + propsStr : ''}>\n\n</${tag}>\n`, forceMoveMarkers: true }]);
    editor.focus();
  }, []);

  const insertSelfClosingComponent = useCallback((tag: string, props: Record<string, string> = {}) => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = editor.getSelection();
    const propsStr = Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ');
    editor.executeEdits('component', [{ range: sel, text: `<${tag}${propsStr ? ' ' + propsStr : ''} />\n`, forceMoveMarkers: true }]);
    editor.focus();
  }, []);

  // ── Initialize Monaco directly ──────────────────────────────────────
  //
  // CRITICAL: Uses a local `isCancelled` flag instead of a ref to handle
  // React StrictMode double-mount correctly. In StrictMode, effects are
  // mounted → cleaned → mounted again. A ref set to `false` in the
  // cleanup persists through the re-mount (useRef only initializes once),
  // causing the second mount's async init to abort early. A local variable
  // is scoped to each closure invocation, so each mount gets a fresh
  // `isCancelled = false`.
  const initialContentRef = useRef(content);

  useEffect(() => {
    let editor: any = null;
    let model: any = null;
    let isCancelled = false;

    const init = async () => {
      try {
        const monaco = await getMonaco();
        if (isCancelled || !editorContainerRef.current) return;
        monacoInstanceRef.current = monaco;

        // Override MDX language auto-closing pairs to exclude single quotes
        // while keeping double-quote, bracket, and paren auto-closing intact.
        try {
          monaco.languages.setLanguageConfiguration('mdx', {
            autoClosingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '"', close: '"', notIn: ['string'] },
              { open: '<', close: '>' },
            ],
          });
        } catch { /* language config override is best-effort */ }

        // Create the model first so we can pass it directly
        model = monaco.editor.createModel(initialContentRef.current || '', 'mdx');
        if (isCancelled) { model.dispose(); model = null; return; }

        // Create the editor with the model
        editor = monaco.editor.create(editorContainerRef.current, {
          model,
          ...MONACO_OPTIONS,
          theme: 'vs-dark',
        });
        if (isCancelled) { editor.dispose(); editor = null; return; }

        editorRef.current = editor;

        // Listen for content changes — one-way flow from Monaco → parent
        editor.onDidChangeModelContent(() => {
          if (isCancelled) return;
          const value = editor.getValue();
          // CRITICAL: Update the ref so the sync effect below doesn't
          // call editor.setValue() on the next render, which would reset
          // the cursor to position (1,1).
          lastContentRef.current = value;
          onChangeRef.current(value);
        });

        // Add keyboard shortcuts
        editor.addAction({
          id: 'format-bold',
          label: 'Bold',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
          run: () => applyFormat('**'),
        });
        editor.addAction({
          id: 'format-italic',
          label: 'Italic',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
          run: () => applyFormat('*'),
        });
        editor.addAction({
          id: 'format-link',
          label: 'Link',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
          run: () => applyLink(),
        });

        setMonacoReady(true);
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to initialize Monaco:', err);
        }
      }
    };

    init();

    return () => {
      isCancelled = true;
      if (editor) {
        editor.dispose();
        editorRef.current = null;
      }
      if (model) {
        model.dispose();
      }
    };
  }, [applyFormat, applyLink]);

  // ── Sync content from parent (tab switch, load draft) ───────────────
  // CRITICAL: This effect must only fire when content changes FROM OUTSIDE
  // the editor (e.g. loading a draft, switching tabs). We track this with
  // lastContentRef, which is updated both here AND in the
  // onDidChangeModelContent handler above. When the user types, the handler
  // updates lastContentRef immediately, so this effect's guard clause
  // (content !== lastContentRef.current) prevents unnecessary editor.setValue()
  // calls that would reset the cursor to position (1,1).

  const lastContentRef = useRef(content);
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (content !== lastContentRef.current) {
      lastContentRef.current = content;
      const position = editor.getPosition();
      editor.setValue(content);
      // Restore cursor position — editor.setValue() always resets to (1,1)
      if (position) {
        try { editor.setPosition(position); } catch {}
      }
      editor.focus();
    }
  }, [content]);

  /** Insert an <Image> component at the current cursor position */
  const insertImageAtCursor = useCallback((path: string, alt: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = editor.getSelection();
    editor.executeEdits('image-upload', [
      { range: selection, text: `<Image path="${path}" alt="${alt}" />\n`, forceMoveMarkers: true },
    ]);
    const pos = selection.getEndPosition();
    editor.setPosition({ lineNumber: pos.lineNumber + 1, column: 1 });
    editor.focus();
  }, []);

  const insertImageRef = useRef(insertImageAtCursor);
  useEffect(() => { insertImageRef.current = insertImageAtCursor; }, [insertImageAtCursor]);

  const handleUploadSuccess = useCallback(
    (result: { path: string; publicUrl: string }, item: { file: File }) => {
      insertImageRef.current(result.path, item.file.name);
    },
    []
  );

  const {
    uploads,
    isDragging,
    isUploading: hookIsUploading,
    uploadFiles,
    retryUpload,
    dismissUpload,
    clearCompleted,
    dragHandlers,
    handlePaste: hookHandlePaste,
  } = useImageUpload({
    bucket: 'post-images',
    onUploadSuccess: handleUploadSuccess,
  });

  // ── Resizable Split Pane ──────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const onMouseMove = (moveEvent: MouseEvent) => {
      let newPercent = ((moveEvent.clientX - containerRect.left) / containerRect.width) * 100;
      if (newPercent < 20) newPercent = 20;
      if (newPercent > 80) newPercent = 80;
      setEditorWidthPercent(newPercent);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  // ── Clipboard Paste (Image) ───────────────────────────────────────────

  useEffect(() => {
    let editorNode: Element | null = null;
    const timer = setTimeout(() => {
      editorNode = containerRef.current?.querySelector('.monaco-editor') ?? null;
      if (editorNode) {
        editorNode.addEventListener('paste', hookHandlePaste as EventListener);
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      if (editorNode) {
        editorNode.removeEventListener('paste', hookHandlePaste as EventListener);
      }
    };
  }, [hookHandlePaste, activeTabId]);

  // ── Render ────────────────────────────────────────────────────────────

  const filteredGroups = COMPONENT_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(g => g.items.length > 0);

  return (
    <div
      className={`flex flex-col h-full bg-[#1e1e1e] border-l border-[#222] ${className}`}
      onDragEnter={dragHandlers.onDragEnter}
      onDragOver={dragHandlers.onDragOver}
      onDragLeave={dragHandlers.onDragLeave}
      onDrop={dragHandlers.onDrop}
    >
      {/* VS Code Editor Tabs */}
      <div className="flex bg-[#111111] h-[35px] shrink-0 overflow-x-auto custom-scrollbar relative">
        {tabs.map(tab => {
          const isSelected = activeTabId === tab.id;
          const displayTabName = (tab.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.mdx';
          const isSaving = tab.saveStatus === 'Saving...';
          const isError = tab.saveStatus === 'Error saving';
          const isDirty = tab.isDirty || tab.saveStatus === 'Unsaved';

          return (
            <div
              key={tab.id}
              onClick={() => onTabSelect?.(tab.id)}
              className={`flex items-center h-full px-3 cursor-pointer min-w-[140px] max-w-[210px] group transition-colors border-r border-[#111111] ${isSelected ? 'bg-[#1e1e1e] text-[#cccccc]' : 'bg-[#2d2d2d] text-[#888888] hover:bg-[#2a2d2e]'}`}
            >
              <Type className={`w-3.5 h-3.5 mr-2 shrink-0 ${isSelected ? 'text-[#519aba]' : 'text-[#888888]'}`} />
              <span className="text-[13px] font-sans truncate select-none flex-1">
                {displayTabName.replace(/^-+|-+$/g, '') || 'untitled.mdx'}
              </span>
              {isSaving ? (
                <span className="w-2 h-2 ml-1.5 rounded-full border border-blue-400 border-t-transparent animate-spin shrink-0" title="Saving..." />
              ) : isError ? (
                <span className="w-2 h-2 ml-1.5 rounded-full bg-red-500 shrink-0" title="Error saving" />
              ) : isDirty ? (
                <span className="ml-1.5 opacity-80 font-mono text-amber-400 text-xs shrink-0" title="Unsaved changes">●</span>
              ) : null}
              <X
                onClick={(e) => { e.stopPropagation(); onTabClose?.(tab.id); }}
                className={`w-4 h-4 ml-2 rounded p-0.5 transition-all shrink-0 ${isSelected ? 'opacity-0 group-hover:opacity-100 hover:bg-[#333]' : 'opacity-0 group-hover:opacity-100 hover:bg-[#444]'}`}
              />
            </div>
          );
        })}
        <button onClick={onNewTab} className="h-full px-3 flex items-center text-[#888] hover:text-white hover:bg-[#333] transition-colors" title="New Draft">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={onOpenDrafts} className="h-full px-3 flex items-center text-[#888] hover:text-white hover:bg-[#333] transition-colors" title="Open Existing Draft">
          <FolderOpen className="w-4 h-4" />
        </button>
        <div className="flex-1 bg-[#111111]"></div>
      </div>

      {/* Unified Toolbar */}
      <div className="flex items-center px-4 h-11 bg-[#181818] border-b border-[#222] shrink-0 justify-between overflow-x-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <ToolbarButton icon={Bold} label="Bold (Cmd+B)" onClick={() => applyFormat('**')} />
            <ToolbarButton icon={Italic} label="Italic (Cmd+I)" onClick={() => applyFormat('*')} />
          </div>
          <div className="w-px h-5 bg-[#333]"></div>
          <div className="flex items-center gap-1">
            <ToolbarButton icon={LinkIcon} label="Link (Cmd+K)" onClick={applyLink} />
            <ToolbarButton icon={Code} label="Inline Code" onClick={() => applyFormat('`')} />
          </div>
          <div className="w-px h-5 bg-[#333]"></div>
          <div className="flex items-center gap-1">
            <ToolbarButton icon={Quote} label="Blockquote" onClick={() => insertComponent('blockquote')} />
            <ToolbarButton icon={LayoutTemplate} label="Code Block (Pre)" onClick={() => insertComponent('pre')} />
            <ToolbarButton icon={TableProperties} label="Table" onClick={() => insertComponent('table')} />
            <ToolbarButton icon={Type} label="Callout Box" onClick={() => insertComponent('Callout', { type: 'info' })} />
          </div>
          <div className="w-px h-5 bg-[#333]"></div>
          <div className="flex items-center gap-1">
            <ToolbarButton icon={ImageIcon} label="Insert Image via URL" onClick={() => insertSelfClosingComponent('Image', { path: 'path/to/image.jpg', alt: 'Description' })} />
            <ToolbarButton icon={FileImage} label="Media Library" onClick={() => setIsMediaLibraryOpen(true)} />
            <ToolbarButton icon={UploadCloud} label="Upload Image" onClick={() => fileInputRef.current?.click()} />
            {hookIsUploading && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono text-[#ff7700] bg-[#ff7700]/10 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff7700]" />
                Uploading...
              </span>
            )}
            <ToolbarButton icon={Video} label="Embed YouTube" onClick={() => insertSelfClosingComponent('YouTube', { id: 'dQw4w9WgXcQ' })} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ToolbarButton
            icon={Columns}
            label="Split Preview"
            onClick={() => setIsSplitView(!isSplitView)}
          />
          {actionButtons}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) uploadFiles(files);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />

      <MediaLibraryModal
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={(path, url) => {
          insertSelfClosingComponent('Image', { path, alt: 'Media Library Image' });
          setIsMediaLibraryOpen(false);
        }}
      />

      <div className="flex flex-1 min-h-0 relative">
        <div className="flex-1 min-w-0 flex flex-col relative h-full">
          <ImageUploadOverlay isDragging={isDragging} />
          <UploadProgress uploads={uploads} onRetry={retryUpload} onDismiss={dismissUpload} onClearCompleted={clearCompleted} />

          {/* VS Code Breadcrumbs */}
          <div className="flex items-center h-[26px] bg-[#1e1e1e] px-4 text-[#cccccc] shrink-0 text-[12px] font-sans shadow-[0_1px_2px_rgba(0,0,0,0.2)] z-10 relative">
            <span className="opacity-60 font-mono">{persona}</span>
            <span className="mx-2 opacity-40">›</span>
            <input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Post Title" className="bg-transparent border-none outline-none text-[#cccccc] placeholder-[#666] focus:ring-0 w-32 lg:w-48 shrink-0 py-0"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); editorRef.current?.focus(); } }}
            />
          </div>

          {/* Subtitle Row */}
          <div className="flex items-center h-[28px] bg-[#1a1a1a] px-4 text-[#cccccc] shrink-0 border-b border-[#222]">
            <input type="text" value={subtitle} onChange={(e) => onSubtitleChange(e.target.value)} placeholder="Subtitle" className="w-full bg-transparent border-none outline-none text-[#999] placeholder-[#555] focus:ring-0 py-0 text-[12px] italic"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); editorRef.current?.focus(); } }}
            />
          </div>

          <div className="flex-1 flex flex-row relative min-h-0" ref={containerRef}>
            {/* Left Editor — using direct Monaco instance instead of @monaco-editor/react */}
            <div className="relative h-full min-w-0" style={{ width: isSplitView ? `${editorWidthPercent}%` : '100%' }}>
              {!monacoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-neutral-500 text-sm font-sans">
                  <span className="animate-pulse">Loading editor...</span>
                </div>
              )}
              <div
                ref={editorContainerRef}
                className="w-full h-full"
                style={{ visibility: monacoReady ? 'visible' : 'hidden' }}
              />
            </div>

            {isSplitView && (
              <div
                className="w-1.5 bg-[#181818] border-x border-[#222] hover:bg-[#007acc] cursor-col-resize transition-colors z-10 shrink-0 relative"
                onMouseDown={handleMouseDown}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none opacity-50">
                  <div className="w-0.5 h-1 bg-[#888] rounded-full"></div>
                  <div className="w-0.5 h-1 bg-[#888] rounded-full"></div>
                  <div className="w-0.5 h-1 bg-[#888] rounded-full"></div>
                </div>
              </div>
            )}

            {isSplitView && (
              <div className="relative h-full overflow-hidden bg-background" style={{ width: `calc(${100 - editorWidthPercent}% - 6px)` }}>
                <MDXPreview content={content} persona={persona} title={title} subtitle={subtitle} className="!h-full !border-none !rounded-none !m-0" />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Grouped Component Library */}
        <div className={`${isSidebarCollapsed ? 'w-14' : 'w-72'} border-l border-[#222] bg-[#0a0a0a] flex flex-col h-full shrink-0 transition-all duration-200`}>
          <div className="p-3 border-b border-[#222] bg-[#111]">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} ${!isSidebarCollapsed ? 'mb-3' : ''}`}>
              {!isSidebarCollapsed && (
                <h3 className="text-[11px] font-sans uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                  <LayoutTemplate className="w-3.5 h-3.5" /> Component Library
                </h3>
              )}
              <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 hover:bg-[#222] rounded text-neutral-500 hover:text-white transition-colors" title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                {isSidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {!isSidebarCollapsed && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input type="text" placeholder="Search components..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#222] rounded-md py-1.5 pl-9 pr-3 text-xs font-sans text-neutral-300 focus:outline-none focus:border-[#555] transition-colors" />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {filteredGroups.length > 0 ? filteredGroups.map((group) => (
              <div key={group.label} className="mb-4">
                {!isSidebarCollapsed && (
                  <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-600">{group.label}</div>
                )}
                <div className="space-y-1">
                  {group.items.map((comp: ComponentEntry) => {
                    const Icon = comp.icon;
                    return (
                      <button
                        key={comp.name}
                        title={isSidebarCollapsed ? comp.name : undefined}
                        onClick={() => comp.selfClosing ? insertSelfClosingComponent(comp.tag, comp.props) : insertComponent(comp.tag, comp.props)}
                        className={`w-full text-left p-2 rounded-md hover:bg-[#1a1a1a] transition-colors flex items-start gap-3 group ${isSidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <div className={`p-1.5 bg-[#111] border border-[#222] rounded group-hover:border-[#333] transition-colors ${!isSidebarCollapsed ? 'mt-0.5' : ''}`}>
                          <Icon className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
                        </div>
                        {!isSidebarCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium font-sans text-neutral-300 group-hover:text-white transition-colors">{comp.name}</div>
                            <div className="text-[11px] font-sans text-neutral-500 truncate mt-0.5">{comp.description}</div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-xs font-sans text-neutral-500">
                {isSidebarCollapsed ? '...' : 'No components found.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
