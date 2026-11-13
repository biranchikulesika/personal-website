'use client';

import { useState, useRef, useTransition, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { BlogPost, BookItem, MediaItem, NoteItem } from '@/lib/types';
import {
  addMediaAction,
  deleteMediaAction,
  deleteOrphanedMediaAction,
} from '@/app/admin/actions';
import { uploadMediaFile } from '@/lib/storage/upload-client';
import { useToast } from '@/hooks/use-toast';
import { ToastView } from '@/components/ui/toast-view';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { NoContentState, NoSearchResults } from '@/components/ui/states';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CodeIcon,
  EllipsisVerticalIcon,
  GridIcon,
  LinkIcon,
  ListIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from '@/components/icons';
import { formatDisplayDate, formatDisplayDateTime } from '@/lib/utils';
import {
  Badge,
  Button,
  Field,
  PageHeader,
  SectionHeading,
  TextInput,
  Toolbar,
} from '@/components/admin/ui';

interface Usage {
  kind: 'post' | 'note' | 'book';
  title: string;
  slug: string;
  published: boolean;
  href: string;
}

interface MediaManagerProps {
  initialMedia: MediaItem[];
  initialOrphanedMedia?: MediaItem[];
  allContent: {
    posts: BlogPost[];
    notes: NoteItem[];
    books: BookItem[];
  };
  initialSearchQuery?: string;
}

function normalizeSrc(src: string): string {
  return src.replace(/^\/+/, '');
}

function tagList(media: MediaItem): string[] {
  const tags = Array.isArray(media.tags) ? media.tags : media.tag ? [media.tag] : [];
  return tags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t && t !== 'atmosphere' && t !== 'profile');
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t && t !== 'atmosphere' && t !== 'profile');
}

export function MediaManager({
  initialMedia,
  initialOrphanedMedia = [],
  allContent,
  initialSearchQuery = '',
}: MediaManagerProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [orphanedList, setOrphanedList] = useState<MediaItem[]>(
    initialOrphanedMedia,
  );
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [showOrphanedOnly, setShowOrphanedOnly] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedOrphanedIds, setSelectedOrphanedIds] = useState<Set<string>>(
    new Set(),
  );
  const [confirmDelete, setConfirmDelete] = useState<{
    items: MediaItem[];
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [drawerMedia, setDrawerMedia] = useState<MediaItem | null>(null);
  const [drawerAlt, setDrawerAlt] = useState('');
  const [drawerTags, setDrawerTags] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { message: toastMessage, showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const orphanedSrcs = useMemo(
    () => new Set(orphanedList.map((m) => m.src)),
    [orphanedList],
  );

  // New Media Form State
  const [fileName, setFileName] = useState('');
  const [fileSrc, setFileSrc] = useState('');
  const [altText, setAltText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [fileSize, setFileSize] = useState('250 KB');
  const [dimensions, setDimensions] = useState('1200 × 800');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Sync the global-search query into the library search box.
  useEffect(() => {
    setSearch(initialSearchQuery);
  }, [initialSearchQuery]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const m of mediaList) {
      for (const t of tagList(m)) set.add(t);
    }
    return Array.from(set).sort();
  }, [mediaList]);

  // Where each asset is referenced across essays, notes and books.
  const usageBySrc = useMemo(() => {
    const map = new Map<string, Usage[]>();
    const add = (src: string | undefined, usage: Usage) => {
      if (!src) return;
      const key = normalizeSrc(src);
      if (!key) return;
      const list = map.get(key);
      if (!list) {
        map.set(key, [usage]);
      } else if (!list.some((u) => u.href === usage.href)) {
        list.push(usage);
      }
    };

    for (const post of allContent.posts) {
      const usage: Usage = {
        kind: 'post',
        title: post.title,
        slug: post.slug,
        published: post.status === 'published',
        href: `/p/${post.slug}`,
      };
      add(post.coverImage, usage);
      for (const section of post.sections) add(section.figure?.src, usage);
    }

    const mediaKeys = [...mediaList, ...orphanedList].map((m) =>
      normalizeSrc(m.src),
    );
    for (const note of allContent.notes) {
      const usage: Usage = {
        kind: 'note',
        title: note.title,
        slug: note.slug,
        published: note.status === 'published',
        href: `/n/${note.slug}`,
      };
      add(note.coverImage, usage);
      // Notes keep image URLs inside their markdown/HTML content strings.
      const content = note.content.join('\n');
      for (const key of mediaKeys) {
        if (key && content.includes(key)) add(key, usage);
      }
    }

    for (const book of allContent.books) {
      add(book.cover, {
        kind: 'book',
        title: book.title,
        slug: book.slug,
        published: book.status === 'published' || book.isPublished === true,
        href: '/library',
      });
    }

    return map;
  }, [allContent, mediaList, orphanedList]);

  function usagesFor(src: string): Usage[] {
    return usageBySrc.get(normalizeSrc(src)) ?? [];
  }

  function getCleanExtension(file: File): string {
    const mime = file.type.toLowerCase();
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'image/gif') return 'gif';
    if (mime === 'image/svg+xml') return 'svg';
    if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
    const match = file.name.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : 'jpg';
  }

  function generateResourceName(file: File): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const randomHash = Math.random().toString(36).substring(2, 10);
    const ext = getCleanExtension(file);
    return `res-${dateStr}-${randomHash}.${ext}`;
  }

  function stripImageMetadata(
    dataUrl: string,
    mimeType: string,
  ): Promise<{ cleanDataUrl: string; width: number; height: number; sizeBytes: number }> {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              cleanDataUrl: dataUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
              sizeBytes: Math.round((dataUrl.length * 3) / 4),
            });
            return;
          }

          // Draw image to 2D canvas: extracts pure pixel buffer and discards all EXIF, GPS, camera and device metadata
          ctx.drawImage(img, 0, 0);

          let exportMime = 'image/jpeg';
          let quality: number | undefined = 0.95;
          if (mimeType === 'image/png') {
            exportMime = 'image/png';
            quality = undefined;
          } else if (mimeType === 'image/webp') {
            exportMime = 'image/webp';
            quality = 0.95;
          }

          const cleanDataUrl = canvas.toDataURL(exportMime, quality);
          const approxBytes = Math.round((cleanDataUrl.length * 3) / 4);

          resolve({
            cleanDataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            sizeBytes: approxBytes,
          });
        } catch {
          resolve({
            cleanDataUrl: dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            sizeBytes: Math.round((dataUrl.length * 3) / 4),
          });
        }
      };
      img.onerror = () => {
        resolve({
          cleanDataUrl: dataUrl,
          width: 1200,
          height: 800,
          sizeBytes: Math.round((dataUrl.length * 3) / 4),
        });
      };
      img.src = dataUrl;
    });
  }

  function processImageFile(file: File) {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = reader.result as string;

      // 1. Strip all metadata (EXIF, GPS, camera specs, device profiles) via canvas re-encoding
      const { cleanDataUrl, width, height, sizeBytes } =
        await stripImageMetadata(rawDataUrl, file.type);

      // 2. Completely rename the file using standard resource convention (res-YYYYMMDD-[hash].[ext])
      const cleanResourceName = generateResourceName(file);

      setPendingFile(file);
      setFileSrc(cleanDataUrl);
      setFileName(cleanResourceName);
      // 3. Keep alt text empty by default; user may add it if desired
      setAltText('');
      setFileSize(`${Math.max(1, Math.round(sizeBytes / 1024))} KB`);
      setDimensions(`${width} × ${height}`);
      setTagsInput(activeTag !== 'all' ? activeTag : '');

      setIsUploading(true);
    };
    reader.readAsDataURL(file);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDragOver(e: React.DragEvent) {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) processImageFile(file);
  }

  function handleCopy(id: string, text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Link copied to clipboard.', 'info');
  }

  function handleAddMedia(e: React.FormEvent) {
    e.preventDefault();
    if (!fileName.trim() || !fileSrc.trim()) return;

    const parsedTags = parseTags(tagsInput);

    startTransition(async () => {
      try {
        // New asset: bytes go to the upload route, which stores the file and
        // registers the row in one request. The preview data URL never leaves
        // the browser (it would blow the 1 MB server action body limit).
        const media = pendingFile
          ? await uploadMediaFile(pendingFile, {
              name: fileName.trim(),
              alt: altText.trim(),
              tags: parsedTags,
              dimensions,
            })
          : null;

        const res = media
          ? { success: true as const, media }
          : await addMediaAction({
              id: `media-${Date.now()}`,
              name: fileName.trim(),
              src: fileSrc,
              alt: altText.trim(),
              size: fileSize,
              dimensions,
              uploadedAt: new Date().toISOString(),
              tags: parsedTags,
            });

        if (res.success && res.media) {
          setMediaList((prev) => [res.media!, ...prev]);
          setIsUploading(false);
          setFileName('');
          setFileSrc('');
          setAltText('');
          setTagsInput('');
          setPendingFile(null);
          showToast('Image uploaded successfully.', 'success');
        } else {
          showToast(res.error || 'Failed to upload image. Please try again.', 'error');
        }
      } catch (err: unknown) {
        showToast((err as Error).message || 'Failed to upload image. Please try again.', 'error');
      }
    });
  }

  function toggleOrphanedSelection(id: string) {
    setSelectedOrphanedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function requestDelete(items: MediaItem[]) {
    setConfirmDelete({ items });
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return;
    const items = confirmDelete.items;
    const orphanItems = items.filter((m) => orphanedSrcs.has(m.src));
    const recordItems = items.filter((m) => !orphanedSrcs.has(m.src));
    startTransition(async () => {
      let ok = true;
      if (orphanItems.length > 0) {
        const srcs = orphanItems.map((m) => m.src);
        const res = await deleteOrphanedMediaAction(srcs);
        if (res.success) {
          const removed = new Set(srcs);
          setOrphanedList((prev) => prev.filter((m) => !removed.has(m.src)));
        } else {
          showToast(res.error || 'Failed to remove image. Please try again.', 'error');
          ok = false;
        }
      }
      for (const media of recordItems) {
        const res = await deleteMediaAction(media.id);
        if (res.success) {
          setMediaList((prev) => prev.filter((m) => m.id !== media.id));
        } else {
          showToast(res.error || 'Failed to remove image. Please try again.', 'error');
          ok = false;
        }
      }
      if (ok) {
        setSelectedOrphanedIds(new Set());
        setConfirmDelete(null);
        setDrawerMedia((current) => {
          if (!current) return null;
          return items.some((m) => m.id === current.id || m.src === current.src)
            ? null
            : current;
        });
        showToast(
          items.length > 1
            ? `${items.length} images removed successfully.`
            : 'Image removed successfully.',
          'success',
        );
      }
    });
  }

  function openDetails(media: MediaItem) {
    setMenuOpenId(null);
    setDrawerMedia(media);
  }

  function handleSaveDetails(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!drawerMedia) return;
    const target = drawerMedia;

    const updatedMedia: MediaItem = {
      ...target,
      alt: drawerAlt.trim(),
      tags: parseTags(drawerTags),
    };

    startTransition(async () => {
      const res = await addMediaAction(updatedMedia);
      if (res.success && res.media) {
        setMediaList((prev) => {
          const exists = prev.some((m) => m.id === target.id);
          if (exists) {
            return prev.map((m) => (m.id === target.id ? res.media! : m));
          }
          return [res.media!, ...prev];
        });
        setOrphanedList((prev) => prev.filter((m) => m.src !== target.src));
        setDrawerMedia(res.media);
        showToast('Changes saved successfully.', 'success');
      } else {
        showToast(res.error || 'Failed to update resource. Please try again.', 'error');
      }
    });
  }

  // Close the row menu on any outside click or Escape.
  useEffect(() => {
    if (!menuOpenId) return;
    function handleClick() {
      setMenuOpenId(null);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpenId(null);
      }
    }
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpenId]);

  const filteredMedia = useMemo(() => {
    const base = showOrphanedOnly ? orphanedList : mediaList;
    const q = search.toLowerCase().trim();
    return base.filter((m) => {
      const itemTags = tagList(m);
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.alt || '').toLowerCase().includes(q) ||
        itemTags.some((t) => t.includes(q));
      const matchTag =
        activeTag === 'all' || itemTags.includes(activeTag.toLowerCase());
      return matchSearch && matchTag;
    });
  }, [mediaList, orphanedList, search, activeTag, showOrphanedOnly]);

  // Drawer: lock scroll, move focus in, Esc closes, arrows page through assets.
  useEffect(() => {
    const media = drawerMedia;
    if (!media) return;

    setDrawerAlt(media.alt || '');
    setDrawerTags(tagList(media).join(', '));

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDrawerMedia(null);
        return;
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      setDrawerMedia((current) => {
        if (!current || filteredMedia.length < 2) return current;
        const index = filteredMedia.findIndex((m) => m.id === current.id);
        if (index === -1) return current;
        const next = e.key === 'ArrowRight' ? index + 1 : index - 1;
        return filteredMedia[(next + filteredMedia.length) % filteredMedia.length];
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerMedia, filteredMedia]);

  const deleteItems = confirmDelete?.items ?? [];
  const deleteUsages = deleteItems.flatMap((item) => usagesFor(item.src));
  const publishedDeleteUsages = deleteUsages.filter((u) => u.published);
  const selectedOrphanedCount = selectedOrphanedIds.size;

  function tagPillClass(active: boolean) {
    return `rounded-full px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
      active
        ? 'bg-accent text-night'
        : 'border border-tinted/20 bg-night-soft text-gray-mid hover:border-tinted/40 hover:text-paper'
    }`;
  }

  function markdownFor(media: MediaItem) {
    return `![${media.alt}](${media.src})`;
  }

  return (
    <div
      className="space-y-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ToastView message={toastMessage} />

      {/* Hidden Device File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {isDragging && (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-night/85 p-4 backdrop-blur-xs">
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/60 text-center">
            <UploadIcon className="h-8 w-8 text-accent" />
            <p className="text-sm font-medium text-paper">Drop images to upload</p>
            <p className="text-xs text-gray-mid">JPG, PNG, WebP, GIF or SVG</p>
          </div>
        </div>
      )}

      <PageHeader
        title="Media"
        description={`${mediaList.length} asset${mediaList.length === 1 ? '' : 's'} in the library${
          orphanedList.length > 0 ? ` · ${orphanedList.length} unreferenced in storage` : ''
        }.`}
        actions={
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="h-3.5 w-3.5" />
            Upload
          </Button>
        }
      />

      <Toolbar className="justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTag('all')}
            aria-pressed={activeTag === 'all'}
            className={tagPillClass(activeTag === 'all')}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              aria-pressed={activeTag === tag}
              className={tagPillClass(activeTag === tag)}
            >
              #{tag}
            </button>
          ))}
          {orphanedSrcs.size > 0 && (
            <button
              type="button"
              onClick={() => {
                setShowOrphanedOnly((v) => !v);
                setActiveTag('all');
              }}
              aria-pressed={showOrphanedOnly}
              title="Media assets in the storage bucket that are not used anywhere on the site"
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                showOrphanedOnly
                  ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                  : 'text-amber-400 ring-1 ring-amber-500/25 hover:bg-amber-500/10'
              }`}
            >
              {orphanedSrcs.size} unreferenced
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72 sm:flex-none">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-mid" />
            <TextInput
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, alt or tags…"
              aria-label="Search media"
              className="pl-9"
            />
          </div>
          <div
            className="inline-flex shrink-0 rounded-lg border border-tinted/30 bg-night p-0.5"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
              aria-label="Grid view"
              title="Grid view"
              className={`rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                view === 'grid'
                  ? 'bg-post-card text-paper'
                  : 'text-gray-mid hover:text-paper'
              }`}
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              aria-label="List view"
              title="List view"
              className={`rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                view === 'list'
                  ? 'bg-post-card text-paper'
                  : 'text-gray-mid hover:text-paper'
              }`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Toolbar>

      {mediaList.length === 0 && orphanedList.length === 0 ? (
        <NoContentState
          title="No media yet"
          description="Images you upload here are available to every essay, note and book cover."
          action={
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="h-3.5 w-3.5" />
              Upload image
            </Button>
          }
        />
      ) : filteredMedia.length === 0 ? (
        <NoSearchResults
          query={search || undefined}
          onReset={() => {
            setSearch('');
            setActiveTag('all');
            setShowOrphanedOnly(false);
          }}
          resetLabel="Reset filters"
        />
      ) : view === 'grid' ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredMedia.map((media) => {
            const isOrphaned = orphanedSrcs.has(media.src);
            const isSelected = selectedOrphanedIds.has(media.id);
            const isMenuOpen = menuOpenId === media.id;
            const usages = usagesFor(media.src);
            const tags = tagList(media);

            return (
              <li
                key={media.id}
                className={`group overflow-hidden rounded-xl border bg-night-soft transition-colors ${
                  isSelected
                    ? 'border-amber-500/60'
                    : 'border-tinted/20 hover:border-tinted/40'
                }`}
              >
                <div className="relative aspect-[4/3] w-full bg-night">
                  <button
                    type="button"
                    onClick={() => openDetails(media)}
                    aria-label={`Open details for ${media.name}`}
                    className="absolute inset-0 h-full w-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                  >
                    <Image
                      src={media.src}
                      alt={media.alt || media.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                  </button>

                  <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5">
                    {showOrphanedOnly && (
                      <button
                        type="button"
                        onClick={() => toggleOrphanedSelection(media.id)}
                        aria-label={
                          isSelected ? `Deselect ${media.name}` : `Select ${media.name}`
                        }
                        aria-pressed={isSelected}
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] transition-colors ${
                          isSelected
                            ? 'bg-amber-600 text-white'
                            : 'bg-night/80 text-transparent ring-1 ring-tinted/50 hover:ring-amber-500'
                        }`}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </button>
                    )}
                    {isOrphaned && <Badge tone="amber">Unreferenced</Badge>}
                  </div>

                  <div
                    className={`absolute right-2 top-2 z-20 flex items-center gap-1 transition-opacity focus-within:pointer-events-auto focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 ${
                      isMenuOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                    }`}
                  >
                    <button
                      type="button"
                      aria-label={`Copy URL for ${media.name}`}
                      title="Copy URL"
                      onClick={() => handleCopy(`url-${media.id}`, media.src)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-night/85 text-gray-mid ring-1 ring-tinted/30 transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {copiedId === `url-${media.id}` ? (
                        <span className="text-[11px] font-bold text-emerald-400">✓</span>
                      ) : (
                        <LinkIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label={`Copy Markdown for ${media.name}`}
                      title="Copy Markdown"
                      onClick={() => handleCopy(`md-${media.id}`, markdownFor(media))}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-night/85 text-gray-mid ring-1 ring-tinted/30 transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {copiedId === `md-${media.id}` ? (
                        <span className="text-[11px] font-bold text-emerald-400">✓</span>
                      ) : (
                        <CodeIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`Actions for ${media.name}`}
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : media.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-night/85 text-gray-mid ring-1 ring-tinted/30 transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </button>

                      {isMenuOpen && (
                        <div
                          className="absolute right-0 top-full z-40 mt-1.5 w-36 rounded-lg border border-tinted/20 bg-night-soft p-1 text-left shadow-xl animate-in fade-in zoom-in-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openDetails(media)}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-post-card"
                          >
                            <PencilIcon className="h-3.5 w-3.5 text-gray-mid" />
                            <span>Edit details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              requestDelete([media]);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openDetails(media)}
                      title={media.name}
                      className="min-w-0 truncate text-left font-mono text-[11px] text-paper hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {media.name}
                    </button>
                    {usages.length > 0 ? (
                      <Badge tone="grey" className="shrink-0">
                        Used in {usages.length}
                      </Badge>
                    ) : (
                      <Badge tone="grey" className="shrink-0">
                        Unused
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] tabular-nums text-gray-mid">
                    {[media.dimensions, media.size, formatDisplayDate(media.uploadedAt)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setActiveTag(tag)}
                          title={`Filter by #${tag}`}
                          className="rounded border border-tinted/20 px-1.5 py-0.5 font-mono text-[10px] text-gray-mid transition-colors hover:border-accent/40 hover:text-accent"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-xl border border-tinted/20">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-tinted/20 bg-night-soft/60">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                    Asset
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                    Details
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                    Uploaded
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                    Tags
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                    Used
                  </th>
                  <th className="w-32 px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tinted/15">
                {filteredMedia.map((media) => {
                  const isOrphaned = orphanedSrcs.has(media.src);
                  const usages = usagesFor(media.src);
                  return (
                    <tr
                      key={media.id}
                      className="group cursor-pointer transition-colors hover:bg-post-card/40"
                      onClick={() => openDetails(media)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-night">
                            <Image
                              src={media.src}
                              alt={media.alt || media.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[24ch] truncate font-mono text-xs text-paper">
                              {media.name}
                            </p>
                            {isOrphaned && (
                              <span className="mt-0.5 inline-block">
                                <Badge tone="amber">Unreferenced</Badge>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs tabular-nums text-gray-mid">
                        {[media.dimensions, media.size].filter(Boolean).join(' · ')}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-mid">
                        {formatDisplayDate(media.uploadedAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {tagList(media).map((tag) => (
                            <Badge key={tag} tone="grey">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {usages.length > 0 ? (
                          <Badge tone="accent">Used in {usages.length}</Badge>
                        ) : (
                          <Badge tone="grey">Unused</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div
                          className="flex items-center justify-end gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleCopy(`url-${media.id}`, media.src)}
                            aria-label={`Copy URL for ${media.name}`}
                            title="Copy URL"
                            className="rounded-md p-1.5 text-gray-mid transition-colors hover:bg-post-card hover:text-paper focus-visible:outline-2 focus-visible:outline-accent"
                          >
                            {copiedId === `url-${media.id}` ? (
                              <span className="text-[11px] font-bold text-emerald-400">✓</span>
                            ) : (
                              <LinkIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(`md-${media.id}`, markdownFor(media))}
                            aria-label={`Copy Markdown for ${media.name}`}
                            title="Copy Markdown"
                            className="rounded-md p-1.5 text-gray-mid transition-colors hover:bg-post-card hover:text-paper focus-visible:outline-2 focus-visible:outline-accent"
                          >
                            {copiedId === `md-${media.id}` ? (
                              <span className="text-[11px] font-bold text-emerald-400">✓</span>
                            ) : (
                              <CodeIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetails(media)}
                            aria-label={`Edit details for ${media.name}`}
                            title="Edit details"
                            className="rounded-md p-1.5 text-gray-mid transition-colors hover:bg-post-card hover:text-paper focus-visible:outline-2 focus-visible:outline-accent"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete([media])}
                            aria-label={`Delete ${media.name}`}
                            title="Delete"
                            className="rounded-md p-1.5 text-gray-mid transition-colors hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-2 focus-visible:outline-accent"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-tinted/20 bg-night-soft/40 px-4 py-2 text-[11px] text-gray-mid">
            <span>
              {filteredMedia.length} of{' '}
              {showOrphanedOnly ? orphanedList.length : mediaList.length} assets
            </span>
            <Badge tone="grey">
              {filteredMedia.filter((m) => usagesFor(m.src).length === 0).length} unused
            </Badge>
          </div>
        </div>
      )}

      {/* Bulk action bar for selected unreferenced assets */}
      {showOrphanedOnly && selectedOrphanedCount > 0 && (
        <div className="sticky bottom-4 z-30 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full border border-tinted/20 bg-night-soft px-5 py-2.5 shadow-xl">
          <span className="text-xs font-semibold text-paper">
            {selectedOrphanedCount} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setSelectedOrphanedIds(new Set())}
            >
              Clear
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                requestDelete(
                  orphanedList.filter((m) => selectedOrphanedIds.has(m.id)),
                )
              }
            >
              Delete selected
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isPending}
        title={
          deleteItems.length > 1
            ? `Delete ${deleteItems.length} assets?`
            : 'Remove image?'
        }
        description={
          <>
            <p>
              {deleteItems.length === 1 ? (
                <>
                  Delete <b className="text-paper">{deleteItems[0].name}</b>? This
                  action cannot be undone.
                </>
              ) : (
                <>
                  Delete <b className="text-paper">{deleteItems.length} assets</b>?
                  This action cannot be undone.
                </>
              )}
            </p>
            {publishedDeleteUsages.length > 0 ? (
              <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                <p className="font-medium text-rose-300">
                  This asset is used by {publishedDeleteUsages.length} published{' '}
                  {publishedDeleteUsages.length === 1 ? 'item' : 'items'} and those
                  pages will show a broken image:
                </p>
                <ul className="mt-1.5 list-disc pl-4">
                  {publishedDeleteUsages.map((usage, index) => (
                    <li key={`${usage.kind}-${usage.slug}-${index}`}>
                      {usage.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : deleteUsages.length > 0 ? (
              <p className="mt-2">
                Only used in {deleteUsages.length} draft{' '}
                {deleteUsages.length === 1 ? 'item' : 'items'} — nothing published
                will break.
              </p>
            ) : (
              <p className="mt-2">Not used anywhere on the site.</p>
            )}
          </>
        }
        confirmLabel="Confirm Delete"
        variant="danger"
        typeToConfirm="DELETE"
      />

      {/* Add Media Modal */}
      {isUploading && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative my-8 w-full max-w-lg rounded-2xl border border-tinted/20 bg-night p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-tinted/20 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-paper">Upload image</h3>
                <p className="mt-0.5 text-xs text-gray-mid">
                  Review details before adding it to the library.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsUploading(false);
                  setFileSrc('');
                  setPendingFile(null);
                }}
                aria-label="Close upload"
              >
                <CloseIcon className="h-4 w-4" />
              </Button>
            </div>

            {isUploading && isPending && (
              <div className="mt-4" role="status" aria-live="polite">
                <div className="h-1 w-full overflow-hidden rounded-full bg-night-soft">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-mid">Uploading…</p>
              </div>
            )}

            <form onSubmit={handleAddMedia} className="mt-5 space-y-4">
              {fileSrc && (
                <div className="flex max-h-56 items-center justify-center overflow-hidden rounded-lg border border-tinted/20 bg-night-soft p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileSrc}
                    alt={altText || fileName}
                    className="max-h-52 w-auto rounded-md object-contain"
                  />
                </div>
              )}

              <Field label="File name" htmlFor="upload-name">
                <TextInput
                  id="upload-name"
                  required
                  placeholder="e.g. res-20260920-a8f3b1c2.jpg"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="font-mono text-xs"
                />
              </Field>

              <Field
                label="Alt text"
                htmlFor="upload-alt"
                hint="Used as the alt text when this image is inserted into essays and notes."
              >
                <TextInput
                  id="upload-alt"
                  placeholder="Describe the image"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </Field>

              <Field
                label="Tags"
                htmlFor="upload-tags"
                hint="Comma separated — e.g. essay, cover, workspace"
              >
                <TextInput
                  id="upload-tags"
                  placeholder="essay, cover, workspace"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </Field>

              <div className="flex items-center justify-between gap-3 border-t border-tinted/20 pt-4">
                <p className="text-[11px] tabular-nums text-gray-mid">
                  {dimensions} · {fileSize}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsUploading(false);
                      setFileSrc('');
                      setPendingFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isPending}>
                    {isPending ? 'Uploading…' : 'Upload'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {drawerMedia && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in"
            aria-hidden
            onClick={() => setDrawerMedia(null)}
          />
          <aside
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-drawer-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l border-tinted/20 bg-night-soft shadow-2xl outline-none animate-in slide-in-from-right"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-tinted/20 bg-night-soft px-4 py-3">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const index = filteredMedia.findIndex(
                      (m) => m.id === drawerMedia.id,
                    );
                    if (index === -1) return;
                    setDrawerMedia(
                      filteredMedia[
                        (index - 1 + filteredMedia.length) % filteredMedia.length
                      ],
                    );
                  }}
                  disabled={filteredMedia.length < 2}
                  aria-label="Previous asset"
                  title="Previous (Left arrow)"
                  className="rounded-md p-1.5 text-gray-mid transition-colors hover:bg-post-card hover:text-paper disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const index = filteredMedia.findIndex(
                      (m) => m.id === drawerMedia.id,
                    );
                    if (index === -1) return;
                    setDrawerMedia(filteredMedia[(index + 1) % filteredMedia.length]);
                  }}
                  disabled={filteredMedia.length < 2}
                  aria-label="Next asset"
                  title="Next (Right arrow)"
                  className="rounded-md p-1.5 text-gray-mid transition-colors hover:bg-post-card hover:text-paper disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              <h2
                id="media-drawer-title"
                className="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-gray-mid"
              >
                Asset details
              </h2>
              <Button
                variant="ghost"
                onClick={() => setDrawerMedia(null)}
                aria-label="Close asset details"
                title="Close (Esc)"
              >
                <CloseIcon className="h-4 w-4" />
              </Button>
            </header>

            <div className="space-y-5 px-4 py-4">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-tinted/20 bg-night">
                <Image
                  src={drawerMedia.src}
                  alt={drawerMedia.alt || drawerMedia.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 448px"
                  className="object-contain"
                  unoptimized
                />
              </div>

              <div>
                <p className="break-all font-mono text-xs text-paper">
                  {drawerMedia.name}
                </p>
                <p className="mt-1 text-[11px] tabular-nums text-gray-mid">
                  {[
                    drawerMedia.dimensions,
                    drawerMedia.size,
                    drawerMedia.uploadedAt
                      ? `Uploaded ${formatDisplayDateTime(drawerMedia.uploadedAt)}`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {tagList(drawerMedia).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tagList(drawerMedia).map((tag) => (
                      <Badge key={tag} tone="grey">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSaveDetails}
                className="space-y-3 border-t border-tinted/20 pt-4"
              >
                <SectionHeading title="Details" />
                <Field label="Alt text" htmlFor="drawer-alt">
                  <TextInput
                    id="drawer-alt"
                    placeholder="Describe the image"
                    value={drawerAlt}
                    onChange={(e) => setDrawerAlt(e.target.value)}
                  />
                </Field>
                <Field label="Tags" htmlFor="drawer-tags" hint="Comma separated">
                  <TextInput
                    id="drawer-tags"
                    placeholder="essay, cover, workspace"
                    value={drawerTags}
                    onChange={(e) => setDrawerTags(e.target.value)}
                  />
                </Field>
                <Button type="submit" variant="secondary" disabled={isPending}>
                  {isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </form>

              <div className="grid grid-cols-2 gap-2 border-t border-tinted/20 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => handleCopy(`url-${drawerMedia.id}`, drawerMedia.src)}
                >
                  {copiedId === `url-${drawerMedia.id}` ? (
                    <>✓ Copied URL</>
                  ) : (
                    <>
                      <LinkIcon className="h-3.5 w-3.5" />
                      Copy URL
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleCopy(`md-${drawerMedia.id}`, markdownFor(drawerMedia))
                  }
                >
                  {copiedId === `md-${drawerMedia.id}` ? (
                    <>✓ Copied MD</>
                  ) : (
                    <>
                      <CodeIcon className="h-3.5 w-3.5" />
                      Copy Markdown
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t border-tinted/20 pt-4">
                <SectionHeading
                  title="Used in"
                  action={
                    <Badge
                      tone="grey"
                    >
                      {usagesFor(drawerMedia.src).length} reference
                      {usagesFor(drawerMedia.src).length === 1 ? '' : 's'}
                    </Badge>
                  }
                />
                {usagesFor(drawerMedia.src).length === 0 ? (
                  <p className="mt-2 text-xs text-gray-mid">
                    Not used anywhere. Deleting it is safe.
                  </p>
                ) : (
                  <ul className="mt-1 divide-y divide-tinted/15">
                    {usagesFor(drawerMedia.src).map((usage) => (
                      <li key={`${usage.kind}-${usage.slug}`}>
                        <a
                          href={
                            usage.published
                              ? usage.href
                              : usage.kind === "book"
                                ? "/admin?tab=content"
                                : `/admin/compose?type=${usage.kind}&slug=${encodeURIComponent(
                                    usage.slug,
                                  )}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 py-2 text-xs text-paper transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <span className="min-w-0 truncate">{usage.title}</span>
                          <Badge tone={usage.published ? 'green' : 'grey'}>
                            {usage.published ? 'Published' : 'Draft'}
                          </Badge>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-tinted/20 pb-6 pt-4">
                <Button
                  variant="danger"
                  onClick={() => requestDelete([drawerMedia])}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Delete asset
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
